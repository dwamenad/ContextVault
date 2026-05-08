import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function VaultPage({ params }: { params: Promise<{ vaultId: string }> }) {
  const { vaultId } = await params;
  const vault = await prisma.vault.findUniqueOrThrow({ where: { id: vaultId }, include: { projects: { include: { documents: true } }, team: true } });
  return (
    <div className="p-6 lg:p-10">
      <p className="text-sm text-slate-500">{vault.team.name}</p>
      <h1 className="text-3xl font-semibold tracking-tight">{vault.name}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{vault.description}</p>
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
