import type { AuthorityStatus, Visibility } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { latestDocumentUri } from "@/lib/mcp/uris";

export type GovernanceUpdateInput = {
  documentId: string;
  visibility: Visibility;
  authorityStatus: AuthorityStatus;
  isMcpExposed: boolean;
};

export async function updateDocumentGovernance(input: GovernanceUpdateInput) {
  const document = await prisma.document.findUniqueOrThrow({
    where: { id: input.documentId },
    include: {
      project: { include: { vault: true } },
      versions: { where: { isLatest: true }, orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });
  const latest = document.versions[0] ?? null;
  const mcpUri = input.isMcpExposed
    ? latestDocumentUri({
        teamId: document.project.vault.teamId,
        vaultId: document.project.vaultId,
        projectId: document.projectId,
        documentId: document.id,
      })
    : null;

  const updated = await prisma.document.update({
    where: { id: input.documentId },
    data: {
      visibility: input.visibility,
      authorityStatus: input.authorityStatus,
      isMcpExposed: input.isMcpExposed,
      mcpUri,
    },
    include: { versions: { orderBy: { versionNumber: "desc" } } },
  });

  if (input.isMcpExposed && latest && mcpUri) {
    await prisma.mcpResource.upsert({
      where: { uri: mcpUri },
      create: {
        projectId: document.projectId,
        documentId: document.id,
        documentVersionId: latest.id,
        uri: mcpUri,
        name: document.title,
        description: `Latest exposed ${document.documentType.toLowerCase().replaceAll("_", " ")} for ${document.project.name}.`,
        mimeType: "text/plain",
        visibility: input.visibility,
      },
      update: {
        documentVersionId: latest.id,
        visibility: input.visibility,
        name: document.title,
        description: `Latest exposed ${document.documentType.toLowerCase().replaceAll("_", " ")} for ${document.project.name}.`,
      },
    });
  }

  if (!input.isMcpExposed) {
    await prisma.mcpResource.deleteMany({ where: { documentId: document.id } });
  }

  return updated;
}

export function governanceChangeSummary(input: GovernanceUpdateInput) {
  return {
    visibility: input.visibility,
    authorityStatus: input.authorityStatus,
    mcpExposure: input.isMcpExposed ? "EXPOSED" : "PRIVATE",
  };
}
