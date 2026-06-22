"use client";

import {
  Building2,
  FileText,
  Landmark,
  LayoutDashboard,
  ReceiptText,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    isActive: (pathname: string) => pathname === "/dashboard",
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: ReceiptText,
    isActive: (pathname: string) => pathname.startsWith("/transactions"),
  },
  {
    href: "/documents",
    label: "Documents",
    icon: FileText,
    isActive: (pathname: string) => pathname.startsWith("/documents"),
  },
  {
    href: "/year-end",
    label: "Year-End",
    icon: Landmark,
    isActive: (pathname: string) => pathname.startsWith("/year-end"),
  },
] as const;

export function AppSidebar({
  properties,
}: {
  properties: ReadonlyArray<{ id: string; name: string }>;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Rental Workspace"
              render={<Link href="/dashboard" />}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                <Building2 className="size-4" aria-hidden="true" />
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-semibold">Rental Workspace</span>
                <span className="truncate text-muted-foreground text-xs">
                  Property accounting
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.isActive(pathname);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={active}
                      render={<Link href={item.href} />}
                    >
                      <Icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Properties</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {properties.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled tooltip="No properties yet">
                    <Building2 aria-hidden="true" />
                    <span>No properties yet</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                properties.map((property) => {
                  const href = `/properties/${property.id}`;
                  const active =
                    pathname === href || pathname.startsWith(`${href}/`);

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
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
