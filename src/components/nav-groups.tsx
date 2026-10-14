"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export type NavItem = {
  title: string;
  icon: LucideIcon;
  href: string;
  /** Defaults to "prefix". */
  match?: "exact" | "prefix";
};

function isActive(item: NavItem, pathname: string): boolean {
  if (pathname === "") {
    return false;
  }

  return item.match === "exact"
    ? pathname === item.href
    : pathname.startsWith(item.href);
}

export function NavGroup({
  label,
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <SidebarGroup className={className}>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function NavMenuItems({
  items,
  pathname = "",
}: {
  items: readonly NavItem[];
  pathname?: string;
}) {
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isActive(item, pathname)}
              render={<Link href={item.href} />}
            >
              <Icon aria-hidden="true" />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}
