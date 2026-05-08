import { ArrowRight, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">ContextVault MCP</h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600 dark:text-slate-300">
            An MCP-native knowledge vault for teams that cannot afford hallucinated context.
          </p>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
            ContextVault turns scattered project files into governed, citation-grade context for AI agents.
          </p>
          <ButtonLink href="/dashboard" className="mt-8 gap-2">
            Open Demo Vault <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
