import { createHash } from "crypto";
import type { AuthorityStatus, DocumentType, SourceType, Visibility } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getEmbeddingProvider, toSqlVector } from "@/lib/embeddings/provider";
import { chunkText } from "@/lib/ingestion/chunk";
import { latestDocumentUri } from "@/lib/mcp/uris";

export type IngestInput = {
  projectId: string;
  title: string;
  rawText: string;
  documentType: DocumentType;
  sourceType: SourceType;
  sourceUri?: string;
  visibility: Visibility;
  authorityStatus: AuthorityStatus;
  isMcpExposed?: boolean;
  fileName?: string;
  fileMimeType?: string;
  fileSize?: number;
  storagePath?: string;
  createdById?: string | null;
};

export async function ingestDocument(input: IngestInput) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: input.projectId },
    include: { vault: true },
  });
  const textHash = createHash("sha256").update(input.rawText).digest("hex");
  const existing = await prisma.document.findFirst({
    where: { projectId: input.projectId, title: input.title },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  const versionNumber = (existing?.versions[0]?.versionNumber ?? 0) + 1;
  const mcpUri = existing?.mcpUri;
  const document =
    existing ??
    (await prisma.document.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        documentType: input.documentType,
        sourceType: input.sourceType,
        sourceUri: input.sourceUri,
        visibility: input.visibility,
        authorityStatus: input.authorityStatus,
        isMcpExposed: Boolean(input.isMcpExposed),
      },
    }));

  await prisma.document.update({
    where: { id: document.id },
    data: {
      documentType: input.documentType,
      sourceType: input.sourceType,
      sourceUri: input.sourceUri,
      visibility: input.visibility,
      authorityStatus: input.authorityStatus,
      isMcpExposed: Boolean(input.isMcpExposed),
      mcpUri,
    },
  });
  await prisma.documentVersion.updateMany({ where: { documentId: document.id }, data: { isLatest: false } });
  const version = await prisma.documentVersion.create({
    data: {
      documentId: document.id,
      versionLabel: `v${versionNumber}`,
      versionNumber,
      fileName: input.fileName,
      fileMimeType: input.fileMimeType,
      fileSize: input.fileSize,
      storagePath: input.storagePath,
      rawText: input.rawText,
      textHash,
      createdById: input.createdById ?? undefined,
      isLatest: true,
    },
  });

  const chunks = chunkText(input.rawText, input.title);
  const provider = getEmbeddingProvider();
  for (const chunk of chunks) {
    const embedding = await provider.embed(`${input.title}\n${chunk.sectionTitle ?? ""}\n${chunk.content}`);
    await prisma.$executeRaw`
      INSERT INTO "Chunk" ("id", "documentVersionId", "projectId", "content", "embedding", "chunkIndex", "sectionTitle", "startChar", "endChar", "tokenCount", "createdAt")
      VALUES (gen_random_uuid()::text, ${version.id}, ${input.projectId}, ${chunk.content}, ${toSqlVector(embedding)}::vector, ${chunk.chunkIndex}, ${chunk.sectionTitle}, ${chunk.startChar}, ${chunk.endChar}, ${chunk.tokenCount}, NOW())
    `;
  }

  if (input.isMcpExposed) {
    const uri = latestDocumentUri({
      teamId: project.vault.teamId,
      vaultId: project.vaultId,
      projectId: project.id,
      documentId: document.id,
    });
    await prisma.document.update({ where: { id: document.id }, data: { mcpUri: uri } });
    await prisma.mcpResource.upsert({
      where: { uri },
      create: {
        projectId: project.id,
        documentId: document.id,
        documentVersionId: version.id,
        uri,
        name: input.title,
        description: `Latest exposed ${input.documentType.toLowerCase().replaceAll("_", " ")} for ${project.name}.`,
        mimeType: "text/plain",
        visibility: input.visibility,
      },
      update: { documentVersionId: version.id, visibility: input.visibility, name: input.title },
    });
  }

  return prisma.document.findUniqueOrThrow({
    where: { id: document.id },
    include: { versions: { orderBy: { versionNumber: "desc" } } },
  });
}
