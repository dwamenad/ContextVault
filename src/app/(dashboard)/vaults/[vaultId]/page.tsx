import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { getDemoVault } from "@/lib/demo/fallback";

export const dynamic = "force-dynamic";

type VaultView = {
  id: string;
  name: string;
  description: string | null;
  team: { name: string };
  projects: { id: string; name: string; description: string | null; documents: { id: string }[] }[];
};

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
  return (
    <div className="p-6 lg:p-10">
      <p className="text-sm text-slate-500">{vault.team.name}</p>
      <h1 className="text-3xl font-semibold tracking-tight">{vault.name}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{vault.description}</p>
      {usingFallback ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Demo fallback mode is active. Database-backed creation and ingestion require Postgres with pgvector.
        </div>
      ) : null}
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {vault.projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="hover:border-slate-400">
              <h2 className="text-xl font-semibold">{project.name}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{project.description}</p>
              <p className="mt-4 text-sm text-slate-500">{project.documents.length} documents</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
