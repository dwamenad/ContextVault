import { AskClient } from "@/components/contextvault/ask-client";
import { prisma } from "@/lib/db/prisma";
import { getDemoProject } from "@/lib/demo/fallback";

export const dynamic = "force-dynamic";

export default async function AskPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let project: { id: string; name: string } | null = getDemoProject(projectId);
  if (!project) {
    try {
      project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    } catch {
      project = getDemoProject("demo-adview");
    }
  }
  if (!project) throw new Error("Project not found.");
  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-semibold tracking-tight">Ask {project.name}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Answers are constrained to retrieved chunks visible to the selected role view.</p>
      <div className="mt-8"><AskClient projectId={project.id} /></div>
    </div>
  );
}
