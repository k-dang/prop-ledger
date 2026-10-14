"use client";

import { FileText, Landmark, LayoutDashboard, ReceiptText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    isActive: (pathname: string) => pathname === "/dashboard",
  },
  {
    href: "/transactions",
    title: "Review",
    icon: ReceiptText,
    isActive: (pathname: string) => pathname.startsWith("/transactions"),
  },
  {
    href: "/documents",
    title: "Documents",
    icon: FileText,
    isActive: (pathname: string) => pathname.startsWith("/documents"),
  },
  {
    href: "/year-end",
    title: "Year-End",
    icon: Landmark,
    isActive: (pathname: string) => pathname.startsWith("/year-end"),
  },
] as const;

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={item.isActive(pathname)}
                  render={<Link href={item.href} />}
                >
                  <Icon aria-hidden="true" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function NavMainFallback() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  tooltip={item.title}
                  render={<Link href={item.href} />}
                >
                  <Icon aria-hidden="true" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
