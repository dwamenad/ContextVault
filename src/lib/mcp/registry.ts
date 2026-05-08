import { prisma } from "@/lib/db/prisma";
import { assertVisible, type RoleView } from "@/lib/permissions/visibility";

export async function listMcpResources(roleView: RoleView = "PI") {
  const resources = await prisma.mcpResource.findMany({
    include: { document: true, documentVersion: true, project: { include: { vault: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return filterResourcesForRole(resources, roleView)
    .map((resource) => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
      visibility: resource.visibility,
      updatedAt: resource.updatedAt,
    }));
}

export function filterResourcesForRole<T extends { visibility: Parameters<typeof assertVisible>[1] }>(resources: T[], roleView: RoleView) {
  return resources
    .filter((resource) => {
      try {
        assertVisible(roleView, resource.visibility);
        return true;
      } catch {
        return false;
      }
    });
}

export async function readMcpResource(uri: string, roleView: RoleView = "PI") {
  const resource = await prisma.mcpResource.findUniqueOrThrow({
    where: { uri },
    include: {
      document: true,
      documentVersion: true,
      project: { include: { vault: { include: { team: true } } } },
    },
  });
  assertVisible(roleView, resource.visibility);
  let version = resource.documentVersion;
  if (!version && resource.documentId) {
    version = await prisma.documentVersion.findFirstOrThrow({ where: { documentId: resource.documentId, isLatest: true } });
  }
  if (!version) throw new Error("MCP resource has no readable document version.");
  return {
    contents: version.rawText,
    mimeType: resource.mimeType,
    metadata: {
      documentTitle: resource.document?.title,
      version: version.versionLabel,
      authorityStatus: resource.document?.authorityStatus,
      visibility: resource.visibility,
      sourceUri: resource.document?.sourceUri,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
    },
  };
}

// TODO: wire these scaffolded MCP tools to the official SDK transport.
export const futureMcpTools = ["search_context", "trace_claim", "compare_versions", "get_authoritative_context"] as const;
