import type { Metadata } from "next";

import { Dashboard } from "@/components/property-workspace/dashboard";

export const metadata: Metadata = {
  title: "Dashboard | Rental Property Workspace",
  description: "Manage rental property setup readiness and ownership records.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
