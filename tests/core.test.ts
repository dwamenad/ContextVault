import { describe, expect, it } from "vitest";
import { askDemoProject } from "@/lib/demo/fallback";
import { selectLatestVersion } from "@/lib/documents/versions";
import { canRoleSeeVisibility } from "@/lib/permissions/visibility";
import { applyRoleVisibility, buildClaimTrace, classifyClaimSupport, detectConflicts, generateAnswerWithCitations, rankChunks, type RetrievedChunk } from "@/lib/retrieval/engine";
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

  it("ranks authoritative latest versions above deprecated versions", () => {
    const ranked = rankChunks([
      { ...baseChunk, id: "old-v1", versionLabel: "v1", authorityStatus: "DEPRECATED", similarity: 0.95, isLatest: false, content: "expected gambling > controls" },
      { ...baseChunk, id: "new-v2", versionLabel: "v2", authorityStatus: "AUTHORITATIVE", similarity: 0.25, isLatest: true, content: "Welch's t-test because unequal variances and unequal sample sizes" },
    ], "Welch t-test unequal variances");
    expect(ranked[0].id).toBe("new-v2");
  });

  it("selects the latest version", () => {
    expect(selectLatestVersion([{ versionNumber: 1, isLatest: false }, { versionNumber: 2, isLatest: true }])?.versionNumber).toBe(2);
  });

  it("classifies claim trace support", () => {
    expect(classifyClaimSupport("is this claim supported Welch's t-test", [baseChunk])).toBe("SUPPORTED");
  });

  it("classifies an overstated ventral striatum claim as contradicted with safer wording", () => {
    const trace = askDemoProject({
      query: "Is the claim 'ventral striatum clearly responded more to gambling ads' supported?",
      roleView: "ANALYST",
      retrievalMode: "INCLUDE_SUPPORTING",
    });
    expect(trace.claimTrace?.classification).toBe("CONTRADICTED");
    expect(trace.claimTrace?.recommendedSaferWording).toContain("does not support");
    expect(trace.citations[0]?.documentTitle).toBe("Analysis Plan");
  });

  it("PUBLIC role cannot access PI_ONLY or ANALYST demo sources", () => {
    const result = askDemoProject({
      query: "Why did we use Welch's t-test?",
      roleView: "PUBLIC_VIEWER",
      retrievalMode: "INCLUDE_SUPPORTING",
    });
    expect(result.answer).toContain("Not enough evidence");
    expect(result.retrievedChunks.every((chunk) => chunk.visibility === "PUBLIC")).toBe(true);
  });

  it("ANALYST role cannot access PI_ONLY demo sources", () => {
    const result = askDemoProject({
      query: "What did lab meeting notes say about figure one confirmatory claims?",
      roleView: "ANALYST",
      retrievalMode: "INCLUDE_SUPPORTING",
    });
    expect(result.answer).toContain("Not enough evidence");
    expect(result.retrievedChunks.some((chunk) => chunk.visibility === "PI_ONLY")).toBe(false);
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
    const changes = detectImportantChanges("+ Welch's t-test for unequal variances\n+ avoid overstating ROI distributions mixed around zero\n+ gambling > everyday products\n+ public-facing summary");
    expect(changes).toContain("Statistical test or Welch's t-test rationale changed.");
    expect(changes).toContain("ROI definition or extraction language changed.");
    expect(changes).toContain("Contrast language changed.");
    expect(changes).toContain("Public/private sharing language changed.");
  });

  it("detects conflicting version language", () => {
    expect(detectConflicts([
      { ...baseChunk, authorityStatus: "DEPRECATED", content: "expected gambling > controls" },
      { ...baseChunk, id: "new", content: "avoid overstating gambling-dominant ventral striatum response" },
    ])).toBe(true);
  });

  it("does not expose chunks outside a requested role view", () => {
    const chunks = applyRoleVisibility([
      { ...baseChunk, id: "public", visibility: "PUBLIC" },
      { ...baseChunk, id: "analyst", visibility: "ANALYST" },
      { ...baseChunk, id: "pi", visibility: "PI_ONLY" },
    ], "PUBLIC_VIEWER");
    expect(chunks.map((chunk) => chunk.id)).toEqual(["public"]);
  });

  it("deprecated sources trigger warnings", async () => {
    const result = await generateAnswerWithCitations(
      { projectId: "p1", query: "expected gambling controls", roleView: "PI", retrievalMode: "INCLUDE_DRAFTS" },
      [{ ...baseChunk, authorityStatus: "DEPRECATED", content: "The older analysis expected gambling > controls.", similarity: 0.4 }],
    );
    expect(result.warnings).toContain("Answer considered deprecated source material.");
  });

  it("insufficient context returns grounded not-enough-evidence answer", async () => {
    const result = await generateAnswerWithCitations(
      { projectId: "p1", query: "What is the lunar phase for recruitment?", roleView: "PI", retrievalMode: "INCLUDE_SUPPORTING" },
      [{ ...baseChunk, content: "Welch's t-test was used for unequal variances.", similarity: 0 }],
    );
    expect(result.answer).toContain("Not enough evidence");
    expect(result.citations).toEqual([]);
  });

  it("builds a claim trace explanation for contradicted claims", () => {
    const trace = buildClaimTrace("ventral striatum clearly responded more to gambling ads", [
      { ...baseChunk, content: "ROI distributions are mixed around zero. Avoid overstating a gambling-dominant ventral striatum response." },
    ]);
    expect(trace.classification).toBe("CONTRADICTED");
    expect(trace.recommendedSaferWording).toContain("does not support");
  });
});
