import { describe, expect, it } from "vitest";
import { selectLatestVersion } from "@/lib/documents/versions";
import { canRoleSeeVisibility } from "@/lib/permissions/visibility";
import { classifyClaimSupport, detectConflicts, rankChunks, type RetrievedChunk } from "@/lib/retrieval/engine";
import { authorityWeight } from "@/lib/retrieval/ranking";
import { filterResourcesForRole } from "@/lib/mcp/registry";
import { detectImportantChanges } from "@/lib/versions/compare";

const baseChunk: RetrievedChunk = {
  id: "chunk-1",
  content: "Welch's t-test was used because ROI distributions may have unequal variances and unequal sample sizes.",
  similarity: 0.4,
  chunkIndex: 0,
  sectionTitle: "Methods",
  pageNumber: null,
  documentVersionId: "version-1",
  versionLabel: "v2",
  isLatest: true,
  documentId: "doc-1",
  documentTitle: "Analysis Plan",
  documentType: "ANALYSIS_PLAN",
  authorityStatus: "AUTHORITATIVE",
  visibility: "ANALYST",
  sourceUri: null,
  createdAt: new Date(),
};

describe("ContextVault product rules", () => {
  it("filters visibility by role", () => {
    expect(canRoleSeeVisibility("PUBLIC_VIEWER", "PUBLIC")).toBe(true);
    expect(canRoleSeeVisibility("PUBLIC_VIEWER", "ANALYST")).toBe(false);
    expect(canRoleSeeVisibility("ANALYST", "PI_ONLY")).toBe(false);
  });

  it("ranks authority above deprecated material", () => {
    expect(authorityWeight.AUTHORITATIVE).toBeGreaterThan(authorityWeight.SUPPORTING);
    expect(authorityWeight.SUPPORTING).toBeGreaterThan(authorityWeight.DEPRECATED);
    const ranked = rankChunks([
      { ...baseChunk, id: "deprecated", authorityStatus: "DEPRECATED", similarity: 0.9, isLatest: false },
      { ...baseChunk, id: "authoritative", similarity: 0.35 },
    ], "welch t-test");
    expect(ranked[0].id).toBe("authoritative");
  });

  it("selects the latest version", () => {
    expect(selectLatestVersion([{ versionNumber: 1, isLatest: false }, { versionNumber: 2, isLatest: true }])?.versionNumber).toBe(2);
  });

  it("classifies claim trace support", () => {
    expect(classifyClaimSupport("is this claim supported Welch's t-test", [baseChunk])).toBe("SUPPORTED");
  });

  it("filters MCP resources by read authorization", () => {
    const resources = [
      { uri: "a", visibility: "PUBLIC" as const },
      { uri: "b", visibility: "ANALYST" as const },
      { uri: "c", visibility: "PI_ONLY" as const },
    ];
    expect(filterResourcesForRole(resources, "PUBLIC_VIEWER").map((r) => r.uri)).toEqual(["a"]);
  });

  it("detects MCP read authorization denial inputs", () => {
    expect(canRoleSeeVisibility("COLLABORATOR", "ANALYST")).toBe(false);
  });

  it("detects important version changes", () => {
    expect(detectImportantChanges("+ Welch's t-test for unequal variances\n+ avoid overstating ROI distributions mixed around zero")).toContain("Changed or added Welch's t-test rationale.");
  });

  it("detects conflicting version language", () => {
    expect(detectConflicts([
      { ...baseChunk, authorityStatus: "DEPRECATED", content: "expected gambling > controls" },
      { ...baseChunk, id: "new", content: "avoid overstating gambling-dominant ventral striatum response" },
    ])).toBe(true);
  });
});
