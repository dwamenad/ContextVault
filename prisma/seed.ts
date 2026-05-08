import { PrismaClient } from "@prisma/client";
import { ingestDocument } from "../src/lib/ingestion/ingest";
import { projectContextUri } from "../src/lib/mcp/uris";

const prisma = new PrismaClient();

async function main() {
  await prisma.retrievalLog.deleteMany();
  await prisma.citation.deleteMany();
  await prisma.chunk.deleteMany();
  await prisma.mcpResource.deleteMany();
  await prisma.documentChange.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.project.deleteMany();
  await prisma.vault.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({ data: { name: "Dr. Maya Smith", email: "pi@smithlab.test" } });
  const team = await prisma.team.create({ data: { name: "Smith Lab" } });
  await prisma.teamMember.create({ data: { teamId: team.id, userId: user.id, role: "PI" } });
  const vault = await prisma.vault.create({
    data: {
      teamId: team.id,
      name: "Decision Neuroscience Vault",
      description: "Governed project context for neuroscience analysis plans, scripts, notes, and public summaries.",
    },
  });
  const project = await prisma.project.create({
    data: {
      vaultId: vault.id,
      name: "AdView Gambling Ads",
      slug: "adview-gambling-ads",
      description: "fMRI study of neural responses to gambling-related advertising versus control advertising.",
    },
  });

  await ingestDocument({
    projectId: project.id,
    title: "AdView Preregistration",
    documentType: "PREREGISTRATION",
    sourceType: "MANUAL_TEXT",
    visibility: "COLLABORATOR",
    authorityStatus: "AUTHORITATIVE",
    isMcpExposed: true,
    createdById: user.id,
    rawText: `# AdView Preregistration
The preregistered primary reward ROI is the ventral striatum. The study compares gambling ads versus control ads while testing hypotheses about reward-related response. We preregistered that reward ROI estimates would be reported with uncertainty intervals and interpreted alongside behavioral measures.

## Hypotheses
Gambling advertisements are expected to recruit reward-related circuitry relative to control ads. Confirmatory interpretation must use the preregistered contrasts and report the ventral striatum ROI rather than unregistered exploratory peaks.`,
  });

  const planV1 = await ingestDocument({
    projectId: project.id,
    title: "Analysis Plan",
    documentType: "ANALYSIS_PLAN",
    sourceType: "MANUAL_TEXT",
    visibility: "ANALYST",
    authorityStatus: "DEPRECATED",
    isMcpExposed: false,
    createdById: user.id,
    rawText: `# Analysis Plan v1
This initial contrast set compares gambling ads against controls. Preliminary ROI extraction will use ventral striatum masks and expected gambling > controls language. Early drafts describe a likely gambling-dominant ventral striatum response, pending additional data checks.

## ROI extraction
Use preliminary ROI extraction from cope outputs. Treat these estimates as provisional until the FSL model documentation is finalized.`,
  });

  const planV2 = await ingestDocument({
    projectId: project.id,
    title: "Analysis Plan",
    documentType: "ANALYSIS_PLAN",
    sourceType: "MANUAL_TEXT",
    visibility: "ANALYST",
    authorityStatus: "AUTHORITATIVE",
    isMcpExposed: true,
    createdById: user.id,
    rawText: `# Analysis Plan v2
The updated contrasts are gambling > everyday products, gambling > non-gambling appetitive, and gambling > mean controls. We use Welch's t-test because ROI distributions may have unequal variances and/or unequal sample sizes across usable runs.

## Interpretation guidance
ROI distributions are mixed around zero. Avoid overstating a gambling-dominant ventral striatum response. The approved language is that the task estimates reward ROI response to gambling-related advertising and compares it to multiple control categories.

## Version note
This version replaces the v1 expected gambling > controls wording with more cautious analysis-plan language.`,
  });

  await ingestDocument({
    projectId: project.id,
    title: "FSL Model README",
    documentType: "README",
    sourceType: "MANUAL_TEXT",
    visibility: "ANALYST",
    authorityStatus: "SUPPORTING",
    isMcpExposed: true,
    createdById: user.id,
    rawText: `# FSL Model README
Models are fit with FSL FEAT. Cope outputs are exported for each participant and condition. ROI mean extraction uses fslmeants with the preregistered ventral striatum mask. This README is model documentation for analysts reproducing the ROI extraction script.`,
  });

  await ingestDocument({
    projectId: project.id,
    title: "Lab Meeting Notes April 2026",
    documentType: "MEETING_NOTE",
    sourceType: "MANUAL_TEXT",
    visibility: "PI_ONLY",
    authorityStatus: "SUPPORTING",
    isMcpExposed: false,
    createdById: user.id,
    rawText: `# Lab Meeting Notes April 2026
Discussed figure one and whether the descriptive ROI distribution should be shown before final enrollment. The lab agreed to avoid making confirmatory claims before more participants are collected. Internal note: use cautious language when describing mixed ROI distributions.`,
  });

  await ingestDocument({
    projectId: project.id,
    title: "Public Summary",
    documentType: "PUBLIC_SUMMARY",
    sourceType: "MANUAL_TEXT",
    visibility: "PUBLIC",
    authorityStatus: "AUTHORITATIVE",
    isMcpExposed: true,
    createdById: user.id,
    rawText: `# Public Summary
The AdView Gambling Ads study examines responses to gambling-related advertising. Public-facing descriptions should say that the project studies how people respond to gambling ads compared with other advertising categories. Do not include sensitive internal analysis details, participant-level information, or provisional ROI claims.`,
  });

  await prisma.mcpResource.createMany({
    data: [
      {
        projectId: project.id,
        uri: projectContextUri({ teamId: team.id, vaultId: vault.id, projectId: project.id }, "latest-authoritative-context"),
        name: "Latest authoritative context",
        description: "Aggregated latest authoritative documents for AdView Gambling Ads.",
        mimeType: "text/plain",
        visibility: "ANALYST",
      },
      {
        projectId: project.id,
        uri: projectContextUri({ teamId: team.id, vaultId: vault.id, projectId: project.id }, "public-context"),
        name: "Public context",
        description: "Public-safe exposed context for AdView Gambling Ads.",
        mimeType: "text/plain",
        visibility: "PUBLIC",
      },
    ],
  });

  console.log({ seeded: true, vault: vault.id, project: project.id, planV1: planV1.versions[0]?.id, planV2: planV2.versions[0]?.id });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
