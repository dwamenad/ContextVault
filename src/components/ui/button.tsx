import Link from "next/link";
import { cn } from "@/lib/utils";

const buttonClass = "inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200";

export function ButtonLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn(buttonClass, className)}>
      {children}
    </Link>
  );
}

export function buttonClasses(className?: string) {
  return cn(buttonClass, className);
}
