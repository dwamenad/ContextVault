import { cn } from "@/lib/utils";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "green" | "blue" | "amber" | "red" | "neutral" }) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    blue: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    red: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
    neutral: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
  };
  return <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function AuthorityBadge({ value }: { value: string }) {
  const tone = value === "AUTHORITATIVE" ? "green" : value === "SUPPORTING" ? "blue" : value === "DEPRECATED" ? "red" : "amber";
  return <Badge tone={tone}>{value}</Badge>;
}

export function VisibilityBadge({ value }: { value: string }) {
  const tone = value === "PUBLIC" ? "green" : value === "COLLABORATOR" ? "blue" : value === "PI_ONLY" ? "red" : "amber";
  return <Badge tone={tone}>{value}</Badge>;
}
