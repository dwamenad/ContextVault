import { AlertTriangle, CheckCircle2, Database } from "lucide-react";
import { Card } from "@/components/ui/card";
import { checkDatabaseReadiness } from "@/lib/system/database-readiness";

export const dynamic = "force-dynamic";

export default async function DatabaseSettingsPage() {
  const readiness = await checkDatabaseReadiness();

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center gap-3">
        <Database className="h-7 w-7" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Database Readiness</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">Production mode requires Postgres with pgvector, migrations, seed data, chunks, and MCP resources.</p>
        </div>
      </div>

      <Card className="mt-8">
        <div className="flex items-center gap-3">
          {readiness.ok ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
          <h2 className="font-semibold">{readiness.ok ? "Database-backed mode is ready" : "Database-backed mode is not ready"}</h2>
        </div>
        <div className="mt-5 grid gap-3">
          {readiness.checks.map((check) => (
            <div key={check.name} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {check.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                <p className="text-sm font-medium">{check.name}</p>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{check.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      {readiness.counts ? (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {Object.entries(readiness.counts).map(([label, value]) => (
            <Card key={label}>
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-sm capitalize text-slate-500">{label.replace(/([A-Z])/g, " $1")}</p>
            </Card>
          ))}
        </div>
      ) : null}

      <Card className="mt-5">
        <h2 className="font-semibold">Next steps</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {readiness.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
        <pre className="mt-4 overflow-auto rounded-md bg-slate-100 p-3 text-xs dark:bg-slate-900">npm run db:setup</pre>
      </Card>
    </div>
  );
}
