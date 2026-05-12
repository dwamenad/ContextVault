import { Card } from "@/components/ui/card";
import { demoDocumentChanges, demoRetrievalLogs, getDemoProject } from "@/lib/demo/fallback";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type AuditLog = {
  id: string;
  query: string;
  answer?: string;
  createdAt: Date;
  project: { name: string };
};

type ChangeLog = {
  id: string;
  summary: string;
  createdAt: Date;
  document: { title: string };
  fromVersion: { versionLabel: string };
  toVersion: { versionLabel: string };
};

export default async function AuditPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let usingFallback = false;
  let projectName = getDemoProject(projectId)?.name ?? "AdView Gambling Ads";
  let retrievalLogs: AuditLog[] = demoRetrievalLogs;
  let changes: ChangeLog[] = demoDocumentChanges;

  if (!getDemoProject(projectId)) {
    try {
      const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
      projectName = project.name;
      retrievalLogs = await prisma.retrievalLog.findMany({
        where: { projectId },
        include: { project: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      });
      changes = await prisma.documentChange.findMany({
        where: { document: { projectId } },
        include: { document: true, fromVersion: true, toVersion: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      });
    } catch {
      usingFallback = true;
      projectName = "AdView Gambling Ads";
    }
  } else {
    usingFallback = true;
  }

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-semibold tracking-tight">Audit</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{projectName}</p>
      {usingFallback ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Demo fallback mode is active. Production audit logs are persisted in Postgres.
        </div>
      ) : null}
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Retrieval Activity</h2>
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {retrievalLogs.map((log) => (
              <div key={log.id} className="py-3">
                <p className="text-sm font-medium">{log.query}</p>
                {log.answer ? <p className="mt-1 line-clamp-2 text-xs text-slate-500">{log.answer}</p> : null}
                <p className="mt-1 text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Version Changes</h2>
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {changes.map((change) => (
              <div key={change.id} className="py-3">
                <p className="text-sm font-medium">
                  {change.document.title}: {change.fromVersion.versionLabel} to {change.toVersion.versionLabel}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{change.summary}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(change.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
