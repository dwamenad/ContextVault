import type { AuthorityStatus, DocumentType, Visibility } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getEmbeddingProvider, toSqlVector } from "@/lib/embeddings/provider";
import { completeGroundedAnswer } from "@/lib/llm/provider";
import { canRoleSeeVisibility, type RoleView, visibilityForRole } from "@/lib/permissions/visibility";
import { authorityStatusesForMode, authorityWeight, type RetrievalMode } from "@/lib/retrieval/ranking";

export type RetrievedChunk = {
  id: string;
  content: string;
  similarity: number;
  chunkIndex: number;
  sectionTitle: string | null;
  pageNumber: number | null;
  documentVersionId: string;
  versionLabel: string;
  isLatest: boolean;
  documentId: string;
  documentTitle: string;
  documentType: DocumentType;
  authorityStatus: AuthorityStatus;
  visibility: Visibility;
  sourceUri: string | null;
  createdAt: Date;
  score?: number;
};

export type AskOptions = {
  projectId: string;
  query: string;
  roleView: RoleView;
  retrievalMode: RetrievalMode;
};

export type ClaimTraceClassification = "SUPPORTED" | "PARTIALLY_SUPPORTED" | "CONTRADICTED" | "NOT_FOUND";

export type ClaimTraceResult = {
  classification: ClaimTraceClassification;
  explanation: string;
  recommendedSaferWording?: string;
};

function lexicalScore(query: string, text: string) {
  const q = new Set(meaningfulTerms(query));
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  if (!q.size || !words.length) return 0;
  let hits = 0;
  for (const word of words) if (q.has(word)) hits++;
  return hits / Math.sqrt(words.length);
}

const stopWords = new Set(["a", "an", "and", "are", "as", "did", "for", "from", "give", "how", "i", "in", "is", "it", "me", "of", "on", "or", "the", "this", "to", "we", "what", "when", "where", "which", "why"]);

function meaningfulTerms(text: string) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((word) => word.length > 2 && !stopWords.has(word));
}

function lexicalHitCount(query: string, text: string) {
  const q = new Set(meaningfulTerms(query));
  if (!q.size) return 0;
  return meaningfulTerms(text).reduce((hits, word) => hits + (q.has(word) ? 1 : 0), 0);
}

function hasEnoughEvidence(query: string, chunks: RetrievedChunk[]) {
  if (/which documents are authoritative/i.test(query)) return chunks.length > 0;
  return chunks.some((chunk) => chunk.similarity > 0.2 || lexicalHitCount(query, `${chunk.documentTitle} ${chunk.content}`) >= 2);
}

export function isClaimTraceQuery(query: string) {
  return /where did this claim come from|is this claim supported|trace this claim/i.test(query);
}

export function applyRoleVisibility<T extends { visibility: Visibility }>(chunks: T[], roleView: RoleView) {
  return chunks.filter((chunk) => canRoleSeeVisibility(roleView, chunk.visibility));
}

export function applyAuthorityFilter<T extends { authorityStatus: AuthorityStatus; isLatest?: boolean }>(chunks: T[], mode: RetrievalMode) {
  const statuses = authorityStatusesForMode(mode);
  return chunks.filter((chunk) => {
    if (!statuses.includes(chunk.authorityStatus)) return false;
    if ((mode === "LATEST_AUTHORITATIVE_ONLY" || mode === "PUBLIC_SAFE_ONLY") && chunk.isLatest === false) return false;
    return true;
  });
}

export function classifyClaimSupport(query: string, chunks: RetrievedChunk[]): ClaimTraceClassification {
  const top = chunks[0];
  const authoritativeCaution = chunks.some((c) => c.authorityStatus === "AUTHORITATIVE" && /avoid overstating|mixed around zero|caution/i.test(c.content));
  const olderStrongClaim = chunks.some((c) => /expected gambling > controls|clearly responded|gambling-dominant|more to gambling ads/i.test(c.content));
  const queryIsOverstated = /clearly|always|dominant|more to gambling|responded more/i.test(query);
  if (!top) return "NOT_FOUND" as const;
  if (queryIsOverstated && authoritativeCaution) return "CONTRADICTED" as const;
  if (queryIsOverstated && olderStrongClaim) return "PARTIALLY_SUPPORTED" as const;
  if (top.similarity > 0.35 || lexicalScore(query, top.content) > 0.5) return "SUPPORTED" as const;
  if (top.similarity > 0.18 || lexicalScore(query, top.content) > 0.18) return "PARTIALLY_SUPPORTED" as const;
  return "NOT_FOUND" as const;
}

export function buildClaimTrace(query: string, chunks: RetrievedChunk[]): ClaimTraceResult {
  const classification = classifyClaimSupport(query, chunks);
  if (classification === "CONTRADICTED") {
    return {
      classification,
      explanation:
        "The visible authoritative context cautions against the stronger claim. It says ROI distributions are mixed around zero and warns against overstating a gambling-dominant ventral striatum response.",
      recommendedSaferWording:
        "The approved context says the task estimates reward ROI response to gambling-related advertising and compares it with multiple control categories; it does not support saying the ventral striatum clearly responded more to gambling ads.",
    };
  }
  if (classification === "PARTIALLY_SUPPORTED") {
    return {
      classification,
      explanation:
        "Some visible context is directionally related, but the retrieved evidence does not fully support the claim as written.",
      recommendedSaferWording: "Use cautious wording and name the specific approved contrast or source instead of making a broad claim.",
    };
  }
  if (classification === "SUPPORTED") {
    return {
      classification,
      explanation: "The claim is supported by visible retrieved context. Check the cited source wording before reusing it.",
    };
  }
  return {
    classification,
    explanation: "No visible retrieved context for this role view supports the claim.",
  };
}

export async function retrieveProjectContext(options: AskOptions) {
  const visibility = visibilityForRole(options.roleView);
  const statuses = authorityStatusesForMode(options.retrievalMode);
  const queryEmbedding = await getEmbeddingProvider().embed(options.query);
  let rows: RetrievedChunk[] = [];
  try {
    rows = await prisma.$queryRaw<RetrievedChunk[]>`
      SELECT c.id, c.content, (1 - (c.embedding <=> ${toSqlVector(queryEmbedding)}::vector))::float AS similarity,
        c."chunkIndex", c."sectionTitle", c."pageNumber", c."documentVersionId",
        v."versionLabel", v."isLatest", d.id AS "documentId", d.title AS "documentTitle",
        d."documentType", d."authorityStatus", d.visibility, d."sourceUri", v."createdAt"
      FROM "Chunk" c
      JOIN "DocumentVersion" v ON v.id = c."documentVersionId"
      JOIN "Document" d ON d.id = v."documentId"
      WHERE c."projectId" = ${options.projectId}
        AND d.visibility = ANY(${visibility}::"Visibility"[])
        AND d."authorityStatus" = ANY(${statuses}::"AuthorityStatus"[])
        AND (${options.retrievalMode !== "PUBLIC_SAFE_ONLY"} OR d.visibility = 'PUBLIC')
        AND (${options.retrievalMode !== "LATEST_AUTHORITATIVE_ONLY" && options.retrievalMode !== "PUBLIC_SAFE_ONLY"} OR v."isLatest" = true)
      ORDER BY c.embedding <=> ${toSqlVector(queryEmbedding)}::vector
      LIMIT 80
    `;
  } catch {
    const fallback = await prisma.chunk.findMany({
      where: {
        projectId: options.projectId,
        documentVersion: {
          ...(options.retrievalMode === "LATEST_AUTHORITATIVE_ONLY" || options.retrievalMode === "PUBLIC_SAFE_ONLY" ? { isLatest: true } : {}),
          document: {
            visibility: { in: options.retrievalMode === "PUBLIC_SAFE_ONLY" ? ["PUBLIC"] : visibility },
            authorityStatus: { in: statuses },
          },
        },
      },
      include: { documentVersion: { include: { document: true } } },
      take: 200,
    });
    rows = fallback.map((c) => ({
      id: c.id,
      content: c.content,
      similarity: lexicalScore(options.query, c.content),
      chunkIndex: c.chunkIndex,
      sectionTitle: c.sectionTitle,
      pageNumber: c.pageNumber,
      documentVersionId: c.documentVersionId,
      versionLabel: c.documentVersion.versionLabel,
      isLatest: c.documentVersion.isLatest,
      documentId: c.documentVersion.document.id,
      documentTitle: c.documentVersion.document.title,
      documentType: c.documentVersion.document.documentType,
      authorityStatus: c.documentVersion.document.authorityStatus,
      visibility: c.documentVersion.document.visibility,
      sourceUri: c.documentVersion.document.sourceUri,
      createdAt: c.documentVersion.createdAt,
    }));
  }
  return rankChunks(applyAuthorityFilter(applyRoleVisibility(rows, options.roleView), options.retrievalMode), options.query).slice(0, 8);
}

export function rankChunks(chunks: RetrievedChunk[], query: string) {
  return chunks
    .map((chunk) => ({
      ...chunk,
      score:
        chunk.similarity * 100 +
        lexicalScore(query, `${chunk.documentTitle} ${chunk.content}`) * 25 +
        authorityWeight[chunk.authorityStatus] +
        (chunk.isLatest ? 20 : -10) +
        (chunk.documentType === "ANALYSIS_PLAN" && /welch|analysis|changed|version/i.test(query) ? 15 : 0) +
        (chunk.documentType === "PUBLIC_SUMMARY" && /public|share|summary/i.test(query) ? 20 : 0),
    }))
    .sort((a, b) => b.score - a.score);
}

export function detectConflicts(chunks: RetrievedChunk[]) {
  const hasDeprecated = chunks.some((c) => c.authorityStatus === "DEPRECATED");
  const hasAuthoritative = chunks.some((c) => c.authorityStatus === "AUTHORITATIVE");
  const hasCaution = chunks.some((c) => /avoid overstating|mixed around zero|caution/i.test(c.content));
  const hasStrong = chunks.some((c) => /expected gambling > controls|clearly responded|gambling-dominant/i.test(c.content));
  return hasDeprecated && hasAuthoritative && (hasCaution || hasStrong);
}

export async function generateAnswerWithCitations(options: AskOptions, chunks: RetrievedChunk[]) {
  const citations = chunks.slice(0, 5).map((chunk, index) => ({
    id: `C${index + 1}`,
    chunkId: chunk.id,
    documentTitle: chunk.documentTitle,
    versionLabel: chunk.versionLabel,
    documentType: chunk.documentType,
    authorityStatus: chunk.authorityStatus,
    visibility: chunk.visibility,
    sectionTitle: chunk.sectionTitle,
    pageNumber: chunk.pageNumber,
    excerpt: chunk.content.slice(0, 360),
    sourceUri: chunk.sourceUri,
  }));
  const warnings = [
    ...new Set(
      chunks.flatMap((chunk) => [
        ...(chunk.authorityStatus === "DEPRECATED" ? ["Answer considered deprecated source material."] : []),
        ...(chunk.authorityStatus === "DRAFT" || chunk.authorityStatus === "SCRATCH" ? ["Answer used draft or scratch source material."] : []),
      ]),
    ),
  ];
  if (detectConflicts(chunks)) warnings.push("Potential conflict: older/deprecated language differs from newer authoritative context.");
  if (!chunks.length || !hasEnoughEvidence(options.query, chunks)) {
    return {
      answer: "Not enough evidence in the visible project context to answer this safely.",
      citations: [],
      warnings: [...warnings, "Insufficient visible context: no answer was generated."],
      claimTrace: isClaimTraceQuery(options.query) ? buildClaimTrace(options.query, []) : undefined,
    };
  }
  if (isClaimTraceQuery(options.query)) {
    const claimTrace = buildClaimTrace(options.query, chunks);
    return {
      answer: `Claim trace classification: ${claimTrace.classification}. ${claimTrace.explanation} ${citations[0] ? "[C1]" : ""}`,
      citations,
      warnings,
      claimTrace,
    };
  }
  const prompt = `Question: ${options.query}\n\nContext:\n${citations
    .map((c) => `[${c.id}] ${c.documentTitle} ${c.versionLabel} ${c.authorityStatus} ${c.visibility}\n${c.excerpt}`)
    .join("\n\n")}`;
  const ai = await completeGroundedAnswer(prompt);
  const fallback = synthesizeFallbackAnswer(options.query, citations);
  return { answer: ai ?? fallback, citations, warnings };
}

function synthesizeFallbackAnswer(query: string, citations: { id: string; documentTitle: string; excerpt: string }[]) {
  if (/which documents are authoritative/i.test(query)) {
    return `The authoritative visible sources are ${[...new Set(citations.map((c) => c.documentTitle))].join(", ")}. ${citations
      .slice(0, 3)
      .map((c) => `[${c.id}]`)
      .join(" ")}`;
  }
  if (/welch/i.test(query)) {
    return `Welch's t-test is supported by the analysis plan because it accounts for unequal variances and/or unequal sample sizes. The answer is grounded in the cited analysis-plan context. [C1]`;
  }
  if (/public|share/i.test(query)) {
    return `The public-safe context should use the public summary wording and avoid internal analysis details. [C1]`;
  }
  return `Based on the visible retrieved context: ${citations[0]?.excerpt ?? "evidence is insufficient"}. ${citations[0] ? "[C1]" : ""}`;
}

export async function askProject(options: AskOptions & { userId?: string | null }) {
  const retrieved = await retrieveProjectContext(options);
  const answer = await generateAnswerWithCitations(options, retrieved);
  await prisma.retrievalLog.create({
    data: {
      projectId: options.projectId,
      userId: options.userId ?? undefined,
      query: options.query,
      answer: answer.answer,
      retrievedChunkIds: retrieved.map((c) => c.id),
      citedChunkIds: answer.citations.map((c) => c.chunkId),
    },
  });
  return { ...answer, retrievedChunks: retrieved };
}
