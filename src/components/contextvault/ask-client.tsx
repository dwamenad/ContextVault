"use client";

import { useState } from "react";
import { AlertTriangle, Send } from "lucide-react";
import { AuthorityBadge, VisibilityBadge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AskResult = {
  answer: string;
  warnings: string[];
  citations: {
    id: string;
    documentTitle: string;
    versionLabel: string;
    documentType: string;
    authorityStatus: string;
    visibility: string;
    sectionTitle: string | null;
    pageNumber: number | null;
    excerpt: string;
    sourceUri: string | null;
  }[];
};

export function AskClient({ projectId }: { projectId: string }) {
  const [query, setQuery] = useState("Why did we use Welch's t-test?");
  const [roleView, setRoleView] = useState("ANALYST");
  const [retrievalMode, setRetrievalMode] = useState("INCLUDE_SUPPORTING");
  const [result, setResult] = useState<AskResult | null>(null);
  const [loading, setLoading] = useState(false);
  async function ask() {
    setLoading(true);
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, query, roleView, retrievalMode }),
    });
    setResult(await response.json());
    setLoading(false);
  }
  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Card>
        <label className="text-sm font-medium">Role view</label>
        <select className="mt-2 w-full rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={roleView} onChange={(e) => setRoleView(e.target.value)}>
          <option value="PI">PI</option>
          <option value="ANALYST">Analyst</option>
          <option value="COLLABORATOR">Collaborator</option>
          <option value="PUBLIC_VIEWER">Public</option>
        </select>
        <label className="mt-4 block text-sm font-medium">Retrieval mode</label>
        <select className="mt-2 w-full rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={retrievalMode} onChange={(e) => setRetrievalMode(e.target.value)}>
          <option value="LATEST_AUTHORITATIVE_ONLY">Latest authoritative only</option>
          <option value="INCLUDE_SUPPORTING">Include supporting documents</option>
          <option value="INCLUDE_DRAFTS">Include drafts</option>
          <option value="PUBLIC_SAFE_ONLY">Public-safe only</option>
        </select>
        <label className="mt-4 block text-sm font-medium">Query</label>
        <textarea className="mt-2 h-36 w-full rounded-md border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className={buttonClasses("mt-4 w-full gap-2")} onClick={ask} disabled={loading}>
          <Send className="h-4 w-4" /> {loading ? "Retrieving..." : "Ask with citations"}
        </button>
      </Card>
      <div className="space-y-5">
        {result?.warnings?.map((warning: string) => (
          <div key={warning} className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {warning}
          </div>
        ))}
        <Card>
          <h2 className="text-lg font-semibold">Answer</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{result?.answer ?? "Ask a project question to retrieve governed context."}</p>
        </Card>
        <div className="grid gap-4">
          {result?.citations?.map((citation) => (
            <Card key={citation.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{citation.id}</span>
                <span className="text-sm font-medium">{citation.documentTitle}</span>
                <span className="text-xs text-slate-500">{citation.versionLabel}</span>
                <AuthorityBadge value={citation.authorityStatus} />
                <VisibilityBadge value={citation.visibility} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{citation.excerpt}</p>
              <p className="mt-2 text-xs text-slate-500">{citation.sectionTitle || "No section"} {citation.pageNumber ? `page ${citation.pageNumber}` : ""}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
