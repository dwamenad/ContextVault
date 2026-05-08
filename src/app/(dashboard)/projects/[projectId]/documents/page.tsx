import { DocumentActions } from "@/components/contextvault/document-actions";
import { AuthorityBadge, VisibilityBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { documents: { include: { versions: { orderBy: { versionNumber: "desc" }, include: { chunks: true } } }, orderBy: { updatedAt: "desc" } } },
  });
  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-semibold tracking-tight">Documents</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{project.name}</p>
      <div className="mt-8"><DocumentActions projectId={project.id} /></div>
      <div className="mt-8 grid gap-5">
        {project.documents.map((doc) => (
          <Card key={doc.id}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-lg font-semibold">{doc.title}</h2>
              <AuthorityBadge value={doc.authorityStatus} />
              <VisibilityBadge value={doc.visibility} />
            </div>
            <p className="mt-2 text-sm text-slate-500">{doc.documentType} · {doc.sourceType} · {doc.isMcpExposed ? doc.mcpUri ?? "MCP exposed" : "Not MCP exposed"}</p>
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
