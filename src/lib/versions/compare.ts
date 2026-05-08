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
    [/Welch|unequal variances|unequal sample/i, "Changed or added Welch's t-test rationale."],
    [/mixed around zero|avoid overstating|caution/i, "Added caution about ROI interpretation."],
    [/gambling > everyday|gambling > non-gambling|mean controls/i, "Updated contrast language."],
    [/participant|sample size|N\s*=/i, "Potential sample-size language changed."],
    [/public-safe|collaborator|public summary/i, "Potential public-safe wording changed."],
    [/expected gambling > controls|gambling-dominant/i, "Older stronger claim language was removed or revised."],
  ] as const;
  return checks.filter(([regex]) => regex.test(diffText)).map(([, label]) => label);
}
