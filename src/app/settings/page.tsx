import type { Metadata } from "next";
import { SettingsDangerZone } from "@/components/settings/settings-danger-zone";

export const metadata: Metadata = {
  title: "Settings | Rental Property Workspace",
  description: "Workspace settings and destructive data controls.",
};

export default function SettingsPage() {
  return (
    <section className="grid gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Workspace-level controls for portfolio data.
        </p>
      </div>
      <SettingsDangerZone />
    </section>
  );
}
