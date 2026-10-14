"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";

import { NavMain, NavMainFallback } from "@/components/nav-main";
import { NavProperties } from "@/components/nav-properties";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar({
  children,
  ...props
}: {
  children: ReactNode;
} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Rental Workspace"
              render={<Link href="/dashboard" />}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-surface text-brand">
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
        <Suspense fallback={<NavMainFallback />}>
          <NavMain />
        </Suspense>
        <NavProperties>{children}</NavProperties>
        <NavSecondary />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
