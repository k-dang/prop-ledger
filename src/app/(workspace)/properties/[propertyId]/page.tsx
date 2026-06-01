import type { Metadata } from "next";

import { PropertyWorkspace } from "@/components/property-workspace/property-workspace";

export const metadata: Metadata = {
  title: "Property Workspace",
  description: "Review setup readiness for a rental property.",
};

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;

  return <PropertyWorkspace propertyId={propertyId} />;
}
