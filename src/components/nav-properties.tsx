"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function SidebarPropertyNavigation({
  properties,
}: {
  properties: ReadonlyArray<{ id: string; name: string }>;
}) {
  const pathname = usePathname();

  if (properties.length === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton disabled tooltip="No properties yet">
          <Building2 aria-hidden="true" />
          <span>No properties yet</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return properties.map((property) => {
    const href = `/properties/${property.id}`;
    const active = pathname === href || pathname.startsWith(`${href}/`);

    return (
      <SidebarMenuItem key={property.id}>
        <SidebarMenuButton
          tooltip={property.name}
          isActive={active}
          render={<Link href={href} />}
        >
          <Building2 aria-hidden="true" />
          <span>{property.name}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  });
}

export function SidebarPropertyNavigationFallback() {
  return (
    <>
      {[0, 1, 2].map((index) => (
        <SidebarMenuItem key={index}>
          <div
            className="flex items-center gap-2 px-2 py-1.5"
            aria-hidden="true"
          >
            <Skeleton className="size-4 shrink-0 rounded" />
            <Skeleton className="h-4 flex-1" />
          </div>
        </SidebarMenuItem>
      ))}
      <span className="sr-only">Loading properties…</span>
    </>
  );
}
