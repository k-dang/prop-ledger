"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavProperties({ children }: { children: ReactNode }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Properties</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

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
    <SidebarMenuItem>
      <SidebarMenuButton disabled tooltip="Loading properties">
        <Building2 aria-hidden="true" />
        <span>Loading properties</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
