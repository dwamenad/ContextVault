import { Card } from "@/components/ui/card";
import { listMcpResources, futureMcpTools } from "@/lib/mcp/registry";
import { prisma } from "@/lib/db/prisma";
import { getDemoProject, listDemoMcpResources } from "@/lib/demo/fallback";

export const dynamic = "force-dynamic";

type McpProject = { id: string; slug: string; vaultId?: string };

export default async function McpPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let usingFallback = false;
  let project: McpProject | null = getDemoProject(projectId);
  let resources = listDemoMcpResources("PI");
  if (!project) {
    try {
      const dbProject = await prisma.project.findUniqueOrThrow({ where: { id: projectId }, include: { vault: true } });
      project = dbProject;
      resources = (await listMcpResources("PI")).filter((resource) => resource.uri.includes(`/project/${dbProject.id}/`));
    } catch {
      usingFallback = true;
      project = getDemoProject("demo-adview");
      resources = listDemoMcpResources("PI");
    }
  } else {
    usingFallback = true;
  }
  if (!project) throw new Error("Project not found.");
  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-semibold tracking-tight">MCP Resources</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Endpoint: <code>/api/mcp/resources</code> and <code>/api/mcp/resources/read</code></p>
      {usingFallback ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Demo fallback mode is active. Resource URIs are stable demo URIs backed by bundled seed context.
        </div>
      ) : null}
      <Card className="mt-8">
        <h2 className="font-semibold">Example URI</h2>
        <pre className="mt-3 overflow-auto rounded-md bg-slate-100 p-3 text-xs dark:bg-slate-900">contextvault://vault/{project.vaultId}/project/{project.slug}/document/document-slug/latest</pre>
      </Card>
      <div className="mt-5 grid gap-4">
        {resources.map((resource) => (
          <Card key={resource.uri}>
            <h2 className="font-semibold">{resource.name}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{resource.description}</p>
            <pre className="mt-3 overflow-auto rounded-md bg-slate-100 p-3 text-xs dark:bg-slate-900">{resource.uri}</pre>
            <p className="mt-2 text-xs text-slate-500">{resource.mimeType} · {resource.visibility}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-5">
        <h2 className="font-semibold">resources/list response shape</h2>
        <pre className="mt-3 overflow-auto rounded-md bg-slate-100 p-3 text-xs dark:bg-slate-900">{JSON.stringify({ resources: resources.slice(0, 2) }, null, 2)}</pre>
        <p className="mt-4 text-sm text-slate-500">Tool scaffolds for future MCP actions: {futureMcpTools.join(", ")}.</p>
      </Card>
    </div>
  );
}
