"use client";

import { FileText, Landmark, LayoutDashboard, ReceiptText } from "lucide-react";
import { usePathname } from "next/navigation";

import { NavGroup, type NavItem, NavMenuItems } from "@/components/nav-groups";

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    match: "exact",
  },
  { href: "/transactions", title: "Review", icon: ReceiptText },
  { href: "/documents", title: "Documents", icon: FileText },
  { href: "/year-end", title: "Year-End", icon: Landmark },
];

export function NavMain() {
  const pathname = usePathname();

  return (
    <NavGroup label="Workspace">
      <NavMenuItems items={NAV_ITEMS} pathname={pathname} />
    </NavGroup>
  );
}
