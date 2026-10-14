"use client";

import { LifeBuoy, Search, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const SECONDARY_ITEMS = [
  {
    href: "/settings",
    title: "Settings",
    icon: Settings2,
    isActive: (pathname: string) => pathname.startsWith("/settings"),
  },
  {
    href: "#",
    title: "Get Help",
    icon: LifeBuoy,
    isActive: (_pathname: string) => false,
  },
  {
    href: "#",
    title: "Search",
    icon: Search,
    isActive: (_pathname: string) => false,
  },
] as const;

export function NavSecondary({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <SidebarGroup className={cn("mt-auto", className)}>
      <SidebarGroupContent>
        <SidebarMenu>
          {SECONDARY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.title}>
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

export function NavSecondaryFallback({ className }: { className?: string }) {
  return (
    <SidebarGroup className={cn("mt-auto", className)}>
      <SidebarGroupContent>
        <SidebarMenu>
          {SECONDARY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.title}>
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
