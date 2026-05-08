import { VersionCompareClient } from "@/components/contextvault/version-compare-client";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function VersionsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const documents = await prisma.document.findMany({
    where: { projectId },
    include: { versions: { orderBy: { versionNumber: "desc" } } },
    orderBy: { title: "asc" },
  });
  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-semibold tracking-tight">Compare versions</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Diff versioned project documents and flag method, claim, and public-safe language changes.</p>
      <div className="mt-8"><VersionCompareClient documents={documents} /></div>
    </div>
  );
}
