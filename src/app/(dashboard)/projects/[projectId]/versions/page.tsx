import { VersionCompareClient } from "@/components/contextvault/version-compare-client";
import { prisma } from "@/lib/db/prisma";
import { getDemoDocuments } from "@/lib/demo/fallback";

export const dynamic = "force-dynamic";

type VersionedDocument = { id: string; title: string; versions: { id: string; versionLabel: string }[] };

export default async function VersionsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let usingFallback = false;
  let documents: VersionedDocument[] = getDemoDocuments(projectId);
  if (!documents.length) {
    try {
      documents = await prisma.document.findMany({
        where: { projectId },
        include: { versions: { orderBy: { versionNumber: "desc" } } },
        orderBy: { title: "asc" },
      });
    } catch {
      usingFallback = true;
      documents = getDemoDocuments("demo-adview");
    }
  } else {
    usingFallback = true;
  }
  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-semibold tracking-tight">Compare versions</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Diff versioned project documents and flag method, claim, and public-safe language changes.</p>
      {usingFallback ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Demo fallback mode is active. Version comparison runs against bundled analysis plan versions.
        </div>
      ) : null}
      <div className="mt-8"><VersionCompareClient documents={documents} /></div>
    </div>
  );
}
