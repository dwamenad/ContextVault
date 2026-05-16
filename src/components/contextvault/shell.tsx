import { Boxes, Database, FileText, Home, Settings } from "lucide-react";
import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard#vaults", label: "Vaults", icon: Boxes },
  { href: "/dashboard#projects", label: "Projects", icon: Database },
  { href: "/dashboard#documents", label: "Documents", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-black dark:text-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-black lg:block">
        <Link href="/" className="text-lg font-semibold tracking-tight">ContextVault MCP</Link>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-64">{children}</main>
    </div>
  );
}
