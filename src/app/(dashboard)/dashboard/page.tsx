import { Activity, Database, FileText } from "lucide-react";
import Link from "next/link";
import { AuthorityBadge, VisibilityBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { demoRetrievalLogs, demoVault } from "@/lib/demo/fallback";

export const dynamic = "force-dynamic";

type DashboardVault = {
  id: string;
  name: string;
  description: string | null;
  team: { name: string };
  projects: { id: string; name: string; documents: { id: string }[] }[];
};

type DashboardDocument = {
  id: string;
  title: string;
  authorityStatus: string;
  visibility: string;
};

type DashboardLog = {
  id: string;
  query: string;
  project: { name: string };
  createdAt: Date;
};

export default async function DashboardPage() {
  let usingFallback = false;
  let vaults: DashboardVault[] = [];
  let recentDocs: DashboardDocument[] = [];
  let logs: DashboardLog[] = [];

  try {
    vaults = await prisma.vault.findMany({ include: { projects: { include: { documents: true } }, team: true } });
    recentDocs = await prisma.document.findMany({ include: { project: true }, orderBy: { updatedAt: "desc" }, take: 5 });
    logs = await prisma.retrievalLog.findMany({ include: { project: true }, orderBy: { createdAt: "desc" }, take: 5 });
  } catch {
    usingFallback = true;
    vaults = [demoVault];
    recentDocs = demoVault.projects.flatMap((project) => project.documents);
    logs = demoRetrievalLogs;
  }

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Private, governed project context with provenance, roles, versions, and MCP resources.</p>
      {usingFallback ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Running in local demo fallback mode because Postgres with pgvector is not reachable at <code>localhost:5432</code>. The dashboard preview is available; ingestion, retrieval logs, and MCP reads need the database.
        </div>
      ) : null}
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Card><Database className="h-5 w-5" /><p className="mt-4 text-2xl font-semibold">{vaults.length}</p><p className="text-sm text-slate-500">Vaults</p></Card>
        <Card><FileText className="h-5 w-5" /><p className="mt-4 text-2xl font-semibold">{recentDocs.length}</p><p className="text-sm text-slate-500">Recent documents</p></Card>
        <Card><Activity className="h-5 w-5" /><p className="mt-4 text-2xl font-semibold">{logs.length}</p><p className="text-sm text-slate-500">Retrieval events</p></Card>
      </div>
      <section id="vaults" className="mt-8 grid gap-5 lg:grid-cols-2">
        {vaults.map((vault) => (
          <Link key={vault.id} href={usingFallback ? "#" : `/vaults/${vault.id}`}>
            <Card className="h-full hover:border-slate-400">
              <p className="text-sm text-slate-500">{vault.team.name}</p>
              <h2 className="mt-2 text-xl font-semibold">{vault.name}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{vault.description}</p>
              <p className="mt-4 text-sm">{vault.projects.length} projects</p>
            </Card>
          </Link>
        ))}
      </section>
      <section id="documents" className="mt-8">
        <h2 className="text-lg font-semibold">Recent documents</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          {recentDocs.map((doc) => (
            <div key={doc.id} className="grid gap-3 border-b border-slate-200 bg-white p-4 text-sm last:border-0 dark:border-slate-800 dark:bg-slate-950 md:grid-cols-[1fr_auto_auto]">
              <span>{doc.title}</span><AuthorityBadge value={doc.authorityStatus} /><VisibilityBadge value={doc.visibility} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
