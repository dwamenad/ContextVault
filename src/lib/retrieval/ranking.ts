import type { AuthorityStatus } from "@prisma/client";

export const authorityWeight: Record<AuthorityStatus, number> = {
  AUTHORITATIVE: 100,
  SUPPORTING: 70,
  DRAFT: 35,
  SCRATCH: 15,
  DEPRECATED: -50,
};

export type RetrievalMode =
  | "LATEST_AUTHORITATIVE_ONLY"
  | "INCLUDE_SUPPORTING"
  | "INCLUDE_DRAFTS"
  | "PUBLIC_SAFE_ONLY";

export function authorityStatusesForMode(mode: RetrievalMode): AuthorityStatus[] {
  if (mode === "LATEST_AUTHORITATIVE_ONLY" || mode === "PUBLIC_SAFE_ONLY") return ["AUTHORITATIVE"];
  if (mode === "INCLUDE_SUPPORTING") return ["AUTHORITATIVE", "SUPPORTING"];
  return ["AUTHORITATIVE", "SUPPORTING", "DRAFT", "SCRATCH", "DEPRECATED"];
}
