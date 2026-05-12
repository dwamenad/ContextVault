import Link from "next/link";
import { AuthorityBadge, VisibilityBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { getDemoProject } from "@/lib/demo/fallback";

export const dynamic = "force-dynamic";

type ProjectDocument = {
  id: string;
  title: string;
  documentType: string;
  visibility: string;
  authorityStatus: string;
  isMcpExposed: boolean;
};

type ProjectView = {
  id: string;
  name: string;
  description: string | null;
  vault?: { name: string };
  documents: ProjectDocument[];
};

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let usingFallback = false;
  let project: ProjectView | null = getDemoProject(projectId);
  if (!project) {
    try {
      project = await prisma.project.findUniqueOrThrow({
        where: { id: projectId },
        include: { documents: { include: { versions: { where: { isLatest: true } } } }, mcpResources: true, vault: true },
      });
    } catch {
      usingFallback = true;
      project = getDemoProject("demo-adview");
    }
  } else {
    usingFallback = true;
  }
  if (!project) throw new Error("Project not found.");
  const grouped = Object.groupBy(project.documents, (doc) => doc.documentType);
  const counts = {
    authoritative: project.documents.filter((d) => d.authorityStatus === "AUTHORITATIVE").length,
    draft: project.documents.filter((d) => d.authorityStatus === "DRAFT").length,
    deprecated: project.documents.filter((d) => d.authorityStatus === "DEPRECATED").length,
    public: project.documents.filter((d) => d.visibility === "PUBLIC").length,
  };
  return (
    <div className="p-6 lg:p-10">
      <p className="text-sm text-slate-500">{usingFallback ? "Decision Neuroscience Vault" : project.vault?.name}</p>
      <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
      <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">{project.description}</p>
      {usingFallback ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Demo fallback mode is active. This project is backed by bundled seed data until Postgres with pgvector is running.
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href={`/projects/${project.id}/ask`}>Ask</ButtonLink>
        <ButtonLink href={`/projects/${project.id}/documents`} className="bg-slate-700 hover:bg-slate-600">Documents</ButtonLink>
        <ButtonLink href={`/projects/${project.id}/versions`} className="bg-slate-700 hover:bg-slate-600">Versions</ButtonLink>
        <ButtonLink href={`/projects/${project.id}/mcp`} className="bg-slate-700 hover:bg-slate-600">MCP</ButtonLink>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {Object.entries(counts).map(([label, value]) => <Card key={label}><p className="text-2xl font-semibold">{value}</p><p className="text-sm capitalize text-slate-500">{label} docs</p></Card>)}
      </div>
      <section className="mt-8 space-y-5">
        {Object.entries(grouped).map(([type, docs]) => (
          <Card key={type}>
            <h2 className="font-semibold">{type}</h2>
            <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
              {docs?.map((doc) => (
                <Link href={`/projects/${project.id}/documents`} key={doc.id} className="grid gap-3 py-3 text-sm md:grid-cols-[1fr_auto_auto_auto]">
                  <span>{doc.title}</span>
                  <AuthorityBadge value={doc.authorityStatus} />
                  <VisibilityBadge value={doc.visibility} />
                  <span className="text-slate-500">{doc.isMcpExposed ? "MCP exposed" : "Private"}</span>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
