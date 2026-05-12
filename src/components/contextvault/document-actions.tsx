"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DocumentActions({ projectId, demoMode = false }: { projectId: string; demoMode?: boolean }) {
  const [message, setMessage] = useState("");
  async function submitManual(formData: FormData) {
    if (demoMode) {
      setMessage("Demo mode does not persist new documents. Start Postgres with pgvector to ingest project files.");
      return;
    }
    setMessage("Ingesting manual document...");
    const body = Object.fromEntries(formData.entries());
    const response = await fetch("/api/documents/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, projectId, isMcpExposed: body.isMcpExposed === "on" }),
    });
    setMessage(response.ok ? "Document ingested. Refresh to view latest chunks and versions." : "Ingestion failed.");
  }
  async function submitUpload(formData: FormData) {
    if (demoMode) {
      setMessage("Demo mode does not persist uploaded files. Start Postgres with pgvector to ingest project files.");
      return;
    }
    setMessage("Uploading and ingesting file...");
    formData.set("projectId", projectId);
    formData.set("isMcpExposed", formData.get("isMcpExposed") ? "true" : "false");
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    setMessage(response.ok ? "File ingested. Refresh to view latest chunks and versions." : "Upload failed.");
  }
  const fields = (
    <>
      <select name="documentType" className="rounded-md border p-2 text-sm dark:border-slate-700 dark:bg-slate-900" defaultValue="OTHER">
        {["PREREGISTRATION", "ANALYSIS_PLAN", "SCRIPT", "README", "MEETING_NOTE", "PAPER_DRAFT", "FIGURE_NOTE", "PUBLIC_SUMMARY", "DATA_DICTIONARY", "OTHER"].map((v) => <option key={v}>{v}</option>)}
      </select>
      <select name="visibility" className="rounded-md border p-2 text-sm dark:border-slate-700 dark:bg-slate-900" defaultValue="ANALYST">
        {["PI_ONLY", "ANALYST", "COLLABORATOR", "PUBLIC"].map((v) => <option key={v}>{v}</option>)}
      </select>
      <select name="authorityStatus" className="rounded-md border p-2 text-sm dark:border-slate-700 dark:bg-slate-900" defaultValue="DRAFT">
        {["AUTHORITATIVE", "SUPPORTING", "DRAFT", "DEPRECATED", "SCRATCH"].map((v) => <option key={v}>{v}</option>)}
      </select>
      <label className="flex items-center gap-2 text-sm"><input name="isMcpExposed" type="checkbox" /> Expose via MCP</label>
    </>
  );
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="font-semibold">Add manual text document</h2>
        {demoMode ? <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Preview only in fallback mode.</p> : null}
        <form action={submitManual} className="mt-4 grid gap-3">
          <input name="title" className="rounded-md border p-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Document title" required />
          <div className="grid gap-2 md:grid-cols-3">{fields}</div>
          <textarea name="rawText" className="h-40 rounded-md border p-3 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Paste governed project context..." required />
          <button className={buttonClasses()} type="submit">Create and ingest</button>
        </form>
      </Card>
      <Card>
        <h2 className="font-semibold">Upload file</h2>
        {demoMode ? <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Preview only in fallback mode.</p> : null}
        <form action={submitUpload} className="mt-4 grid gap-3">
          <input name="title" className="rounded-md border p-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Optional title" />
          <input name="file" className="rounded-md border p-2 text-sm dark:border-slate-700" type="file" required />
          <div className="grid gap-2 md:grid-cols-3">{fields}</div>
          <button className={buttonClasses("gap-2")} type="submit"><Upload className="h-4 w-4" /> Upload and ingest</button>
        </form>
        <p className="mt-4 text-xs text-slate-500">Supports txt, md, pdf, docx, csv, and common script/code files. Unsupported files retain metadata with a readable notice.</p>
      </Card>
      {message ? <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p> : null}
    </div>
  );
}
