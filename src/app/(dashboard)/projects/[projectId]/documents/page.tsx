import { DocumentActions } from "@/components/contextvault/document-actions";
import { DocumentGovernanceForm } from "@/components/contextvault/document-governance-form";
import { AuthorityBadge, VisibilityBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { getDemoProject } from "@/lib/demo/fallback";

export const dynamic = "force-dynamic";

type DocumentsProject = {
  id: string;
  name: string;
  documents: {
    id: string;
    title: string;
    documentType: string;
    sourceType: string;
    visibility: string;
    authorityStatus: string;
    isMcpExposed: boolean;
    mcpUri: string | null;
    versions: {
      id: string;
      versionLabel: string;
      isLatest: boolean;
      rawText: string;
      chunks: { id: string }[];
    }[];
  }[];
};

export default async function DocumentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let usingFallback = false;
  let project: DocumentsProject | null = getDemoProject(projectId);
  if (!project) {
    try {
      project = await prisma.project.findUniqueOrThrow({
        where: { id: projectId },
        include: { documents: { include: { versions: { orderBy: { versionNumber: "desc" }, include: { chunks: true } } }, orderBy: { updatedAt: "desc" } } },
      });
    } catch {
      usingFallback = true;
      project = getDemoProject("demo-adview");
    }
  } else {
    usingFallback = true;
  }
  if (!project) throw new Error("Project not found.");
  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-semibold tracking-tight">Documents</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{project.name}</p>
      {usingFallback ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Demo fallback mode is active. Upload and manual ingestion are shown for the production flow, but persistence requires Postgres with pgvector.
        </div>
      ) : null}
      <div className="mt-8"><DocumentActions projectId={project.id} demoMode={usingFallback} /></div>
      <div className="mt-8 grid gap-5">
        {project.documents.map((doc) => (
          <Card key={doc.id}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-lg font-semibold">{doc.title}</h2>
              <AuthorityBadge value={doc.authorityStatus} />
              <VisibilityBadge value={doc.visibility} />
            </div>
            <p className="mt-2 text-sm text-slate-500">{doc.documentType} · {doc.sourceType} · {doc.isMcpExposed ? doc.mcpUri ?? "MCP exposed" : "Not MCP exposed"}</p>
            <DocumentGovernanceForm
              documentId={doc.id}
              visibility={doc.visibility}
              authorityStatus={doc.authorityStatus}
              isMcpExposed={doc.isMcpExposed}
              demoMode={usingFallback}
            />
            <div className="mt-4 grid gap-3">
              {doc.versions.map((version) => (
                <div key={version.id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
                  <div className="flex items-center justify-between"><span className="font-medium">{version.versionLabel}{version.isLatest ? " · latest" : ""}</span><span className="text-slate-500">{version.chunks.length} chunks</span></div>
                  <p className="mt-2 line-clamp-2 text-slate-600 dark:text-slate-300">{version.rawText}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
