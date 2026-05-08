"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Version = { id: string; versionLabel: string };
type VersionedDocument = { id: string; title: string; versions: Version[] };
type CompareResult = { summary: string; importantChanges: string[]; diff: string };

export function VersionCompareClient({ documents }: { documents: VersionedDocument[] }) {
  const analysis = documents.find((doc) => doc.title === "Analysis Plan") ?? documents[0];
  const versions = analysis?.versions ?? [];
  const [documentId, setDocumentId] = useState(analysis?.id ?? "");
  const selected = documents.find((doc) => doc.id === documentId);
  const selectedVersions = selected?.versions ?? [];
  const [fromVersionId, setFrom] = useState(versions.at(-1)?.id ?? versions[1]?.id ?? "");
  const [toVersionId, setTo] = useState(versions[0]?.id ?? "");
  const [result, setResult] = useState<CompareResult | null>(null);
  async function compare() {
    const response = await fetch("/api/versions/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, fromVersionId, toVersionId }),
    });
    setResult(await response.json());
  }
  return (
    <div className="space-y-5">
      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <select className="rounded-md border p-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={documentId} onChange={(e) => setDocumentId(e.target.value)}>
            {documents.map((doc) => <option key={doc.id} value={doc.id}>{doc.title}</option>)}
          </select>
          <select className="rounded-md border p-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={fromVersionId} onChange={(e) => setFrom(e.target.value)}>
            {selectedVersions.map((v) => <option key={v.id} value={v.id}>{v.versionLabel}</option>)}
          </select>
          <select className="rounded-md border p-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={toVersionId} onChange={(e) => setTo(e.target.value)}>
            {selectedVersions.map((v) => <option key={v.id} value={v.id}>{v.versionLabel}</option>)}
          </select>
          <button className={buttonClasses()} onClick={compare}>Compare versions</button>
        </div>
      </Card>
      {result ? (
        <>
          <Card>
            <h2 className="font-semibold">What changed?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{result.summary}</p>
            <h3 className="mt-4 text-sm font-semibold">Potentially important changes</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">{result.importantChanges.map((c: string) => <li key={c}>{c}</li>)}</ul>
          </Card>
          <Card>
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-xs leading-5">{result.diff}</pre>
          </Card>
        </>
      ) : null}
    </div>
  );
}
