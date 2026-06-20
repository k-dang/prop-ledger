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
  SidebarTrigger,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    isActive: (pathname: string) =>
      pathname === "/dashboard" || pathname.startsWith("/properties"),
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

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-sidebar-border border-b p-2">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/dashboard"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-1.5 outline-none ring-sidebar-ring focus-visible:ring-2 group-data-[collapsible=icon]:hidden"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700">
              <Building2 className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-sm">
                Rental Workspace
              </span>
              <span className="block truncate text-muted-foreground text-xs">
                Property accounting
              </span>
            </span>
          </Link>
          <SidebarTrigger className="shrink-0" />
        </div>
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
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
