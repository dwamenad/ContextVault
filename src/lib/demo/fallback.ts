import { diffLines } from "diff";
import { canRoleSeeVisibility, type RoleView } from "@/lib/permissions/visibility";
import { authorityStatusesForMode, type RetrievalMode } from "@/lib/retrieval/ranking";
import { detectImportantChanges } from "@/lib/versions/compare";

type DemoVisibility = "PI_ONLY" | "ANALYST" | "COLLABORATOR" | "PUBLIC";
type DemoAuthority = "AUTHORITATIVE" | "SUPPORTING" | "DRAFT" | "DEPRECATED" | "SCRATCH";
type DemoDocumentType =
  | "PREREGISTRATION"
  | "ANALYSIS_PLAN"
  | "SCRIPT"
  | "README"
  | "MEETING_NOTE"
  | "PUBLIC_SUMMARY";

export type DemoVersion = {
  id: string;
  documentId: string;
  versionLabel: string;
  versionNumber: number;
  rawText: string;
  isLatest: boolean;
  createdAt: Date;
  updatedAt: Date;
  chunks: { id: string; content: string; sectionTitle: string; chunkIndex: number }[];
};

export type DemoDocument = {
  id: string;
  projectId: string;
  title: string;
  documentType: DemoDocumentType;
  sourceType: "MANUAL_TEXT";
  sourceUri: string | null;
  visibility: DemoVisibility;
  authorityStatus: DemoAuthority;
  isMcpExposed: boolean;
  mcpUri: string | null;
  createdAt: Date;
  updatedAt: Date;
  versions: DemoVersion[];
};

const now = new Date("2026-04-30T12:00:00.000Z");

function version(documentId: string, versionLabel: string, versionNumber: number, rawText: string, isLatest = true): DemoVersion {
  return {
    id: `${documentId}-${versionLabel}`,
    documentId,
    versionLabel,
    versionNumber,
    rawText,
    isLatest,
    createdAt: now,
    updatedAt: now,
    chunks: [
      {
        id: `${documentId}-${versionLabel}-chunk-1`,
        content: rawText,
        sectionTitle: rawText.match(/^#\s+(.+)$/m)?.[1] ?? "Overview",
        chunkIndex: 0,
      },
    ],
  };
}

const preregText = `# AdView Preregistration
The preregistered primary reward ROI is the ventral striatum. The study compares gambling ads versus control ads while testing hypotheses about reward-related response. Reward ROI estimates should be reported with uncertainty intervals and interpreted alongside behavioral measures.

## Hypotheses
Gambling advertisements are expected to recruit reward-related circuitry relative to control ads. Confirmatory interpretation must use the preregistered contrasts and report the ventral striatum ROI rather than unregistered exploratory peaks.`;

const planV1Text = `# Analysis Plan v1
This initial contrast set compares gambling ads against controls. Preliminary ROI extraction will use ventral striatum masks and expected gambling > controls language. Early drafts describe a likely gambling-dominant ventral striatum response, pending additional data checks.

## ROI extraction
Use preliminary ROI extraction from cope outputs. Treat these estimates as provisional until the FSL model documentation is finalized.`;

const planV2Text = `# Analysis Plan v2
The updated contrasts are gambling > everyday products, gambling > non-gambling appetitive, and gambling > mean controls. We use Welch's t-test because ROI distributions may have unequal variances and/or unequal sample sizes across usable runs.

## Interpretation guidance
ROI distributions are mixed around zero. Avoid overstating a gambling-dominant ventral striatum response. The approved language is that the task estimates reward ROI response to gambling-related advertising and compares it to multiple control categories.

## Version note
This version replaces the v1 expected gambling > controls wording with more cautious analysis-plan language.`;

const readmeText = `# FSL Model README
Models are fit with FSL FEAT. Cope outputs are exported for each participant and condition. ROI mean extraction uses fslmeants with the preregistered ventral striatum mask. This README is model documentation for analysts reproducing the ROI extraction script.`;

const scriptText = `# ROI extraction script
The ROI extraction script loops over cope outputs and calls fslmeants for the ventral striatum mask. Outputs are written as participant-level ROI means for later Welch's t-test summaries.`;

const notesText = `# Lab Meeting Notes April 2026
Discussed figure one and whether the descriptive ROI distribution should be shown before final enrollment. The lab agreed to avoid making confirmatory claims before more participants are collected. Internal note: use cautious language when describing mixed ROI distributions.`;

const publicText = `# Public Summary
The AdView Gambling Ads study examines responses to gambling-related advertising. Public-facing descriptions should say that the project studies how people respond to gambling ads compared with other advertising categories. Do not include sensitive internal analysis details, participant-level information, or provisional ROI claims.`;

function doc(input: Omit<DemoDocument, "projectId" | "sourceType" | "sourceUri" | "createdAt" | "updatedAt" | "versions" | "mcpUri"> & { versions: DemoVersion[] }): DemoDocument {
  const mcpUri = input.isMcpExposed
    ? `contextvault://team/demo-team/vault/demo-vault/project/demo-adview/document/${input.id}/latest`
    : null;
  return {
    ...input,
    projectId: "demo-adview",
    sourceType: "MANUAL_TEXT",
    sourceUri: null,
    mcpUri,
    createdAt: now,
    updatedAt: now,
  };
}

export const demoDocuments: DemoDocument[] = [
  doc({
    id: "demo-prereg",
    title: "AdView Preregistration",
    documentType: "PREREGISTRATION",
    authorityStatus: "AUTHORITATIVE",
    visibility: "COLLABORATOR",
    isMcpExposed: true,
    versions: [version("demo-prereg", "v1", 1, preregText)],
  }),
  doc({
    id: "demo-plan",
    title: "Analysis Plan",
    documentType: "ANALYSIS_PLAN",
    authorityStatus: "AUTHORITATIVE",
    visibility: "ANALYST",
    isMcpExposed: true,
    versions: [version("demo-plan", "v2", 2, planV2Text, true), version("demo-plan", "v1", 1, planV1Text, false)],
  }),
  doc({
    id: "demo-readme",
    title: "FSL Model README",
    documentType: "README",
    authorityStatus: "SUPPORTING",
    visibility: "ANALYST",
    isMcpExposed: true,
    versions: [version("demo-readme", "v1", 1, readmeText)],
  }),
  doc({
    id: "demo-script",
    title: "ROI Extraction Script",
    documentType: "SCRIPT",
    authorityStatus: "SUPPORTING",
    visibility: "ANALYST",
    isMcpExposed: false,
    versions: [version("demo-script", "v1", 1, scriptText)],
  }),
  doc({
    id: "demo-notes",
    title: "Lab Meeting Notes April 2026",
    documentType: "MEETING_NOTE",
    authorityStatus: "SUPPORTING",
    visibility: "PI_ONLY",
    isMcpExposed: false,
    versions: [version("demo-notes", "v1", 1, notesText)],
  }),
  doc({
    id: "demo-public",
    title: "Public Summary",
    documentType: "PUBLIC_SUMMARY",
    authorityStatus: "AUTHORITATIVE",
    visibility: "PUBLIC",
    isMcpExposed: true,
    versions: [version("demo-public", "v1", 1, publicText)],
  }),
];

export const demoVault = {
  id: "demo-vault",
  name: "Decision Neuroscience Vault",
  description: "Governed project context for neuroscience analysis plans, scripts, notes, and public summaries.",
  team: { name: "Smith Lab" },
  projects: [
    {
      id: "demo-adview",
      name: "AdView Gambling Ads",
      slug: "adview-gambling-ads",
      description: "fMRI study of neural responses to gambling-related advertising versus control advertising.",
      documents: demoDocuments,
    },
  ],
};

export const demoRetrievalLogs = [
  {
    id: "demo-log-1",
    query: "Why did we use Welch's t-test?",
    project: { name: "AdView Gambling Ads" },
    createdAt: now,
  },
  {
    id: "demo-log-2",
    query: "Give me the latest approved public-safe summary.",
    project: { name: "AdView Gambling Ads" },
    createdAt: now,
  },
];

export function isDemoProjectId(projectId: string) {
  return projectId === "demo-adview";
}

export function getDemoProject(projectId = "demo-adview") {
  if (!isDemoProjectId(projectId)) return null;
  return demoVault.projects[0];
}

export function getDemoVault(vaultId = "demo-vault") {
  if (vaultId !== "demo-vault") return null;
  return demoVault;
}

export function getDemoDocuments(projectId = "demo-adview") {
  return getDemoProject(projectId)?.documents ?? [];
}

function lexicalScore(query: string, text: string) {
  const terms = new Set(query.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return words.reduce((score, word) => score + (terms.has(word) ? 1 : 0), 0);
}

function visibleDemoDocuments(roleView: RoleView, retrievalMode: RetrievalMode) {
  const statuses = authorityStatusesForMode(retrievalMode);
  return demoDocuments.filter((document) => {
    if (!canRoleSeeVisibility(roleView, document.visibility)) return false;
    if (retrievalMode === "PUBLIC_SAFE_ONLY" && document.visibility !== "PUBLIC") return false;
    return statuses.includes(document.authorityStatus);
  });
}

export function askDemoProject(input: { query: string; roleView: RoleView; retrievalMode: RetrievalMode }) {
  const docs = visibleDemoDocuments(input.roleView, input.retrievalMode);
  const ranked = docs
    .flatMap((document) =>
      document.versions
        .filter((versionItem) => versionItem.isLatest)
        .flatMap((versionItem) =>
          versionItem.chunks.map((chunk) => ({
            document,
            version: versionItem,
            chunk,
            score: lexicalScore(input.query, `${document.title} ${versionItem.rawText}`),
          })),
        ),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const query = input.query.toLowerCase();
  const citations = ranked.map((item, index) => ({
    id: `C${index + 1}`,
    chunkId: item.chunk.id,
    documentTitle: item.document.title,
    versionLabel: item.version.versionLabel,
    documentType: item.document.documentType,
    authorityStatus: item.document.authorityStatus,
    visibility: item.document.visibility,
    sectionTitle: item.chunk.sectionTitle,
    pageNumber: null,
    excerpt: item.chunk.content.slice(0, 360),
    sourceUri: item.document.sourceUri,
  }));

  const warnings: string[] = ["Demo fallback mode: results are generated from bundled seed context because the database is unavailable."];
  let answer = "Evidence is insufficient in the visible demo context for this role view.";

  if (query.includes("welch")) {
    answer = "Welch's t-test is justified in the approved analysis plan because ROI distributions may have unequal variances and/or unequal sample sizes across usable runs. [C1]";
  } else if (query.includes("ventral striatum clearly") || query.includes("is this claim supported") || query.includes("trace this claim")) {
    answer = "Claim trace classification: CONTRADICTED. The latest approved analysis plan says ROI distributions are mixed around zero and warns against overstating a gambling-dominant ventral striatum response. [C1]";
    warnings.push("Potential conflict: older v1 language expected gambling > controls, while v2 uses more cautious approved language.");
  } else if (query.includes("what changed") || query.includes("between analysis plan v1 and v2")) {
    answer = "Analysis Plan v2 adds updated contrasts, Welch's t-test rationale, and caution that ROI distributions are mixed around zero. It replaces the stronger v1 expected gambling > controls wording with more cautious approved language. [C1]";
  } else if (query.includes("public") || query.includes("share") || query.includes("summary")) {
    answer = "The latest approved public-safe summary says the study examines responses to gambling-related advertising compared with other advertising categories, without sensitive internal analysis details or provisional ROI claims. [C1]";
  } else if (query.includes("authoritative")) {
    const authoritative = docs.filter((document) => document.authorityStatus === "AUTHORITATIVE").map((document) => document.title);
    answer = `The authoritative visible documents are: ${authoritative.join(", ")}. ${citations[0] ? "[C1]" : ""}`;
  } else if (citations[0]) {
    answer = `Based on the strongest visible demo context: ${citations[0].excerpt} [C1]`;
  }

  return {
    answer,
    warnings,
    citations,
    retrievedChunks: ranked.map((item) => ({
      id: item.chunk.id,
      content: item.chunk.content,
      documentTitle: item.document.title,
      versionLabel: item.version.versionLabel,
      authorityStatus: item.document.authorityStatus,
      visibility: item.document.visibility,
    })),
  };
}

export function compareDemoVersions(documentId: string, fromVersionId: string, toVersionId: string) {
  const document = demoDocuments.find((item) => item.id === documentId);
  const fromVersion = document?.versions.find((item) => item.id === fromVersionId);
  const toVersion = document?.versions.find((item) => item.id === toVersionId);
  if (!document || !fromVersion || !toVersion) throw new Error("Demo versions not found.");
  const diff = diffLines(fromVersion.rawText, toVersion.rawText)
    .map((part) => `${part.added ? "+ " : part.removed ? "- " : "  "}${part.value.trimEnd()}`)
    .join("\n");
  const importantChanges = detectImportantChanges(diff);
  return {
    diff,
    summary: `Compared ${fromVersion.versionLabel} to ${toVersion.versionLabel}: ${importantChanges.join("; ") || "minor wording changes."}`,
    importantChanges,
  };
}

export function listDemoMcpResources(roleView: RoleView = "PI") {
  const documentResources = demoDocuments
    .filter((document) => document.isMcpExposed && document.mcpUri && canRoleSeeVisibility(roleView, document.visibility))
    .map((document) => ({
      uri: document.mcpUri as string,
      name: document.title,
      description: `Latest exposed ${document.documentType.toLowerCase().replaceAll("_", " ")} for AdView Gambling Ads.`,
      mimeType: "text/plain",
      visibility: document.visibility,
      updatedAt: document.updatedAt,
    }));

  const aggregate = [
    {
      uri: "contextvault://team/demo-team/vault/demo-vault/project/demo-adview/latest-authoritative-context",
      name: "Latest authoritative context",
      description: "Aggregated latest authoritative documents for AdView Gambling Ads.",
      mimeType: "text/plain",
      visibility: "ANALYST" as const,
      updatedAt: now,
    },
    {
      uri: "contextvault://team/demo-team/vault/demo-vault/project/demo-adview/public-context",
      name: "Public context",
      description: "Public-safe exposed context for AdView Gambling Ads.",
      mimeType: "text/plain",
      visibility: "PUBLIC" as const,
      updatedAt: now,
    },
  ].filter((resource) => canRoleSeeVisibility(roleView, resource.visibility));

  return [...documentResources, ...aggregate];
}

export function readDemoMcpResource(uri: string, roleView: RoleView = "PI") {
  const resource = listDemoMcpResources(roleView).find((item) => item.uri === uri);
  if (!resource) throw new Error("Demo MCP resource is not visible for this role.");
  if (uri.endsWith("/latest-authoritative-context")) {
    return {
      contents: demoDocuments
        .filter((document) => document.authorityStatus === "AUTHORITATIVE" && canRoleSeeVisibility(roleView, document.visibility))
        .map((document) => document.versions.find((item) => item.isLatest)?.rawText)
        .filter(Boolean)
        .join("\n\n"),
      mimeType: "text/plain",
      metadata: { visibility: resource.visibility, authorityStatus: "AUTHORITATIVE", version: "latest", sourceUri: null, createdAt: now, updatedAt: now },
    };
  }
  if (uri.endsWith("/public-context")) {
    const publicDoc = demoDocuments.find((document) => document.visibility === "PUBLIC");
    return {
      contents: publicDoc?.versions[0]?.rawText ?? "",
      mimeType: "text/plain",
      metadata: { documentTitle: publicDoc?.title, visibility: "PUBLIC", authorityStatus: publicDoc?.authorityStatus, version: "latest", sourceUri: null, createdAt: now, updatedAt: now },
    };
  }
  const document = demoDocuments.find((item) => item.mcpUri === uri);
  const latest = document?.versions.find((item) => item.isLatest);
  if (!document || !latest) throw new Error("Demo MCP resource has no readable document version.");
  return {
    contents: latest.rawText,
    mimeType: "text/plain",
    metadata: {
      documentTitle: document.title,
      version: latest.versionLabel,
      authorityStatus: document.authorityStatus,
      visibility: document.visibility,
      sourceUri: document.sourceUri,
      createdAt: latest.createdAt,
      updatedAt: latest.updatedAt,
    },
  };
}
