"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export function DocumentGovernanceForm({
  documentId,
  visibility,
  authorityStatus,
  isMcpExposed,
  demoMode = false,
}: {
  documentId: string;
  visibility: string;
  authorityStatus: string;
  isMcpExposed: boolean;
  demoMode?: boolean;
}) {
  const [currentVisibility, setVisibility] = useState(visibility);
  const [currentAuthority, setAuthority] = useState(authorityStatus);
  const [exposed, setExposed] = useState(isMcpExposed);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch(`/api/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visibility: currentVisibility,
        authorityStatus: currentAuthority,
        isMcpExposed: exposed,
      }),
    });
    const body = await response.json();
    setMessage(response.ok ? body.message ?? "Governance updated." : body.error ?? "Governance update failed.");
    setSaving(false);
  }

  return (
    <div className="mt-4 rounded-md border border-slate-200 p-3 dark:border-slate-800">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
        <label className="grid gap-1 text-xs font-medium text-slate-500">
          Visibility
          <select className="rounded-md border p-2 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" value={currentVisibility} onChange={(event) => setVisibility(event.target.value)}>
            {["PI_ONLY", "ANALYST", "COLLABORATOR", "PUBLIC"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-500">
          Authority
          <select className="rounded-md border p-2 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" value={currentAuthority} onChange={(event) => setAuthority(event.target.value)}>
            {["AUTHORITATIVE", "SUPPORTING", "DRAFT", "DEPRECATED", "SCRATCH"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
          <input type="checkbox" checked={exposed} onChange={(event) => setExposed(event.target.checked)} />
          MCP exposed
        </label>
        <button className={buttonClasses("self-end gap-2")} onClick={save} disabled={saving}>
          <ShieldCheck className="h-4 w-4" />
          {saving ? "Saving..." : demoMode ? "Preview" : "Save"}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}
