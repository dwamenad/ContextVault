import { diffLines } from "diff";
import { prisma } from "@/lib/db/prisma";
import { completeGroundedAnswer } from "@/lib/llm/provider";

export async function compareDocumentVersions(documentId: string, fromVersionId: string, toVersionId: string) {
  const [fromVersion, toVersion] = await Promise.all([
    prisma.documentVersion.findUniqueOrThrow({ where: { id: fromVersionId } }),
    prisma.documentVersion.findUniqueOrThrow({ where: { id: toVersionId } }),
  ]);
  const parts = diffLines(fromVersion.rawText, toVersion.rawText);
  const diffText = parts
    .map((part) => `${part.added ? "+ " : part.removed ? "- " : "  "}${part.value.trimEnd()}`)
    .join("\n");
  const importantChanges = detectImportantChanges(diffText);
  const aiSummary =
    (await completeGroundedAnswer(
      `Summarize the important changes between two document versions. Focus on claims, methods, sample size, analysis language, and public-safe wording.\n\n${diffText.slice(0, 12000)}`,
    )) ?? `Compared ${fromVersion.versionLabel} to ${toVersion.versionLabel}: ${importantChanges.join("; ") || "minor wording changes."}`;

  const change = await prisma.documentChange.upsert({
    where: { documentId_fromVersionId_toVersionId: { documentId, fromVersionId, toVersionId } },
    create: { documentId, fromVersionId, toVersionId, summary: aiSummary, diffText },
    update: { summary: aiSummary, diffText },
  });
  return { diff: diffText, summary: change.summary, importantChanges, change };
}

export function detectImportantChanges(diffText: string) {
  const checks = [
    [/Welch|t-test|unequal variances|unequal sample/i, "Statistical test or Welch's t-test rationale changed."],
    [/method|analysis plan|FSL FEAT|fslmeants|cope outputs|model documentation/i, "Methods or analysis workflow language changed."],
    [/participant|sample size|usable runs|enrollment|\bN\s*=/i, "Sample size, enrollment, or usable-run language changed."],
    [/ROI|ventral striatum|mask|reward ROI|ROI extraction/i, "ROI definition or extraction language changed."],
    [/contrast|gambling > everyday|gambling > non-gambling|mean controls|control ads/i, "Contrast language changed."],
    [/mixed around zero|avoid overstating|caution|confirmatory claims|provisional/i, "Claim strength or caution language changed."],
    [/public-safe|public-facing|collaborator|sensitive internal|participant-level|private/i, "Public/private sharing language changed."],
    [/expected gambling > controls|gambling-dominant|clearly responded|clearly respond/i, "Older stronger claim language was removed or revised."],
  ] as const;
  return checks.filter(([regex]) => regex.test(diffText)).map(([, label]) => label);
}
