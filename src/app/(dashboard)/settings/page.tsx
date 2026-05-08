import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <Card className="mt-8">
        <h2 className="font-semibold">MVP auth placeholder</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          The MVP uses a local mock PI session. TODO: add Auth.js/NextAuth, SSO, production RBAC, encryption, and connector permission grants before production use.
        </p>
      </Card>
    </div>
  );
}
