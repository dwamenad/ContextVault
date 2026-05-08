export function latestDocumentUri(input: { teamId: string; vaultId: string; projectId: string; documentId: string }) {
  return `contextvault://team/${input.teamId}/vault/${input.vaultId}/project/${input.projectId}/document/${input.documentId}/latest`;
}

export function versionDocumentUri(input: {
  teamId: string;
  vaultId: string;
  projectId: string;
  documentId: string;
  versionId: string;
}) {
  return `contextvault://team/${input.teamId}/vault/${input.vaultId}/project/${input.projectId}/document/${input.documentId}/version/${input.versionId}`;
}

export function projectContextUri(input: { teamId: string; vaultId: string; projectId: string }, kind: "latest-authoritative-context" | "public-context") {
  return `contextvault://team/${input.teamId}/vault/${input.vaultId}/project/${input.projectId}/${kind}`;
}
