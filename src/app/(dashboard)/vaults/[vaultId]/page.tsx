import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Database,
  FileText,
  GitCompare,
  LockKeyhole,
  Network,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import { AuthorityBadge, Badge, VisibilityBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { getDemoVault } from "@/lib/demo/fallback";

export const dynamic = "force-dynamic";

type VaultDocument = {
  id: string;
  title: string;
  documentType: string;
  visibility: string;
  authorityStatus: string;
  isMcpExposed: boolean;
  mcpUri?: string | null;
};

type VaultView = {
  id: string;
  name: string;
  description: string | null;
  team: { name: string };
  projects: { id: string; name: string; slug?: string; description: string | null; documents: VaultDocument[] }[];
};

const roleViews = [
  { role: "PI", label: "PI", description: "Full lab record, including PI-only meeting notes." },
  { role: "ANALYST", label: "Analyst", description: "Analysis plans, scripts, model docs, collaborator and public context." },
  { role: "COLLABORATOR", label: "Collaborator", description: "Shared preregistration and public-safe project context." },
  { role: "PUBLIC_VIEWER", label: "Public", description: "Only approved public summary material." },
];

const trustLoop = [
  { title: "Ingest", description: "Documents become versions, chunks, hashes, and embeddings.", icon: FileText },
  { title: "Govern", description: "Authority labels and role visibility are enforced before retrieval.", icon: ShieldCheck },
  { title: "Answer", description: "Claims map back to citation cards and hidden chunks stay hidden.", icon: SearchCheck },
  { title: "Expose", description: "Selected latest documents become stable MCP resources.", icon: Network },
];

const demoQueries = [
  { label: "Why Welch's t-test?", query: "Why did we use Welch's t-test?", roleView: "ANALYST", retrievalMode: "INCLUDE_SUPPORTING" },
  {
    label: "Trace an overstated claim",
    query: "Is the claim 'ventral striatum clearly responded more to gambling ads' supported?",
    roleView: "ANALYST",
    retrievalMode: "INCLUDE_SUPPORTING",
  },
  { label: "Public-safe summary", query: "Give me the latest approved public-safe summary.", roleView: "PUBLIC_VIEWER", retrievalMode: "PUBLIC_SAFE_ONLY" },
  { label: "Authoritative docs", query: "Which documents are authoritative for this project?", roleView: "PI", retrievalMode: "LATEST_AUTHORITATIVE_ONLY" },
];

function visibleCountForRole(documents: VaultDocument[], role: string) {
  return documents.filter((document) => {
    if (role === "PI") return true;
    if (role === "ANALYST") return ["ANALYST", "COLLABORATOR", "PUBLIC"].includes(document.visibility);
    if (role === "COLLABORATOR") return ["COLLABORATOR", "PUBLIC"].includes(document.visibility);
    return document.visibility === "PUBLIC";
  }).length;
}

function queryHref(projectId: string, query: (typeof demoQueries)[number]) {
  const params = new URLSearchParams({
    query: query.query,
    roleView: query.roleView,
    retrievalMode: query.retrievalMode,
  });
  return `/projects/${projectId}/ask?${params.toString()}`;
}

export default async function VaultPage({ params }: { params: Promise<{ vaultId: string }> }) {
  const { vaultId } = await params;
  let usingFallback = false;
  let vault: VaultView | null = getDemoVault(vaultId);
  if (!vault) {
    try {
      vault = await prisma.vault.findUniqueOrThrow({ where: { id: vaultId }, include: { projects: { include: { documents: true } }, team: true } });
    } catch {
      usingFallback = true;
      vault = getDemoVault("demo-vault");
    }
  } else {
    usingFallback = true;
  }
  if (!vault) throw new Error("Vault not found.");
  const documents = vault.projects.flatMap((project) => project.documents);
  const primaryProject = vault.projects[0];
  const metrics = [
    { label: "Projects", value: vault.projects.length, icon: Database },
    { label: "Documents", value: documents.length, icon: FileText },
    { label: "Authoritative", value: documents.filter((document) => document.authorityStatus === "AUTHORITATIVE").length, icon: BadgeCheck },
    { label: "MCP exposed", value: documents.filter((document) => document.isMcpExposed).length, icon: Network },
  ];
  const authoritySummary = ["AUTHORITATIVE", "SUPPORTING", "DRAFT", "DEPRECATED", "SCRATCH"].map((status) => ({
    status,
    count: documents.filter((document) => document.authorityStatus === status).length,
  }));
  const mcpResource = documents.find((document) => document.mcpUri)?.mcpUri ?? "contextvault://team/demo-team/vault/demo-vault/project/demo-adview/document/demo-plan/latest";

  return (
    <div className="p-6 lg:p-10">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <p className="text-sm font-medium text-slate-500">{vault.team.name}</p>
          <h1 className="mt-2 max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">{vault.name}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{vault.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {primaryProject ? <ButtonLink href={`/projects/${primaryProject.id}`}>Open AdView project</ButtonLink> : null}
            {primaryProject ? (
              <ButtonLink href={`/projects/${primaryProject.id}/ask`} className="bg-slate-700 hover:bg-slate-600">
                Ask with citations
              </ButtonLink>
            ) : null}
            {primaryProject ? (
              <ButtonLink href={`/projects/${primaryProject.id}/mcp`} className="bg-slate-700 hover:bg-slate-600">
                View MCP resources
              </ButtonLink>
            ) : null}
          </div>
          {usingFallback ? (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
              Demo fallback mode is active. Database-backed creation and ingestion require Postgres with pgvector.
            </div>
          ) : null}
        </div>

        <Card className="border-slate-300 bg-slate-950 text-white shadow-lg dark:border-slate-700">
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-6 w-6 text-emerald-300" />
            <h2 className="text-lg font-semibold">Trust contract</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            ContextVault is not a generic chat surface. It is a governed context layer that makes permissions, provenance, document versions, and MCP exposure visible before an agent uses the content.
          </p>
          <div className="mt-5 space-y-3 text-sm">
            {[
              "Role visibility is filtered server-side before answer generation.",
              "Latest authoritative versions outrank deprecated drafts.",
              "Every answer is expected to carry citation metadata.",
              "Selected documents expose stable contextvault:// MCP URIs.",
            ].map((item) => (
              <div key={item} className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span className="text-slate-200">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <Icon className="h-5 w-5 text-slate-500" />
              <p className="mt-4 text-3xl font-semibold">{metric.value}</p>
              <p className="text-sm text-slate-500">{metric.label}</p>
            </Card>
          );
        })}
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Projects in this vault</h2>
              <p className="mt-1 text-sm text-slate-500">Each project carries its own governance, retrieval, versioning, and MCP surface.</p>
            </div>
            <Badge tone="blue">Research lab wedge</Badge>
          </div>
          <div className="mt-5 space-y-4">
            {vault.projects.map((project) => (
              <div key={project.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{project.name}</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{project.description}</p>
                  </div>
                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 hover:text-slate-600 dark:text-white dark:hover:text-slate-300"
                  >
                    Open project <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>{project.documents.length} documents</Badge>
                  <Badge tone="green">{project.documents.filter((document) => document.authorityStatus === "AUTHORITATIVE").length} authoritative</Badge>
                  <Badge tone="blue">{project.documents.filter((document) => document.isMcpExposed).length} MCP exposed</Badge>
                  <Badge tone="amber">{project.documents.filter((document) => ["PI_ONLY", "ANALYST"].includes(document.visibility)).length} restricted</Badge>
                </div>
                <div className="mt-5 divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {project.documents.slice(0, 5).map((document) => (
                    <div key={document.id} className="grid gap-3 p-3 text-sm md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                      <div>
                        <p className="font-medium">{document.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{document.documentType.replaceAll("_", " ")}</p>
                      </div>
                      <AuthorityBadge value={document.authorityStatus} />
                      <VisibilityBadge value={document.visibility} />
                      <span className="text-xs text-slate-500">{document.isMcpExposed ? "MCP resource" : "Vault only"}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <ButtonLink href={`/projects/${project.id}/documents`} className="bg-slate-700 hover:bg-slate-600">
                    Documents
                  </ButtonLink>
                  <ButtonLink href={`/projects/${project.id}/versions`} className="bg-slate-700 hover:bg-slate-600">
                    Compare versions
                  </ButtonLink>
                  <ButtonLink href={`/projects/${project.id}/audit`} className="bg-slate-700 hover:bg-slate-600">
                    Audit trail
                  </ButtonLink>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-semibold">Role-based views</h2>
            </div>
            <div className="mt-4 space-y-3">
              {roleViews.map((role) => (
                <div key={role.role} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{role.label}</p>
                    <Badge tone={role.role === "PUBLIC_VIEWER" ? "green" : role.role === "PI" ? "red" : "blue"}>{visibleCountForRole(documents, role.role)} visible</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{role.description}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <GitCompare className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-semibold">Authority distribution</h2>
            </div>
            <div className="mt-4 space-y-3">
              {authoritySummary.map((item) => (
                <div key={item.status} className="flex items-center justify-between gap-4 text-sm">
                  <AuthorityBadge value={item.status} />
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <h2 className="text-lg font-semibold">Try the trust loop</h2>
          <p className="mt-1 text-sm text-slate-500">These launch into the Ask page with the role view and retrieval mode already selected.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {primaryProject
              ? demoQueries.map((query) => (
                  <Link
                    key={query.label}
                    href={queryHref(primaryProject.id, query)}
                    className="group rounded-lg border border-slate-200 p-4 text-sm hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{query.label}</span>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{query.query}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>{query.roleView.replace("_", " ")}</Badge>
                      <Badge tone="blue">{query.retrievalMode.replaceAll("_", " ")}</Badge>
                    </div>
                  </Link>
                ))
              : null}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Network className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-semibold">MCP resource preview</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Selected project documents are exposed as deterministic resources first, with tools and prompts left as explicit future scaffolds.
          </p>
          <pre className="mt-4 overflow-auto rounded-md bg-slate-100 p-3 text-xs leading-5 text-slate-700 dark:bg-slate-900 dark:text-slate-300">{mcpResource}</pre>
          {primaryProject ? (
            <Link href={`/projects/${primaryProject.id}/mcp`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
              Open resource registry <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </Card>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {trustLoop.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <Icon className="h-5 w-5 text-slate-500" />
              <h2 className="mt-4 font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
