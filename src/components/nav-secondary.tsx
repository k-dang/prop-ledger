"use client";

import { LifeBuoy, Search, Settings2 } from "lucide-react";
import { usePathname } from "next/navigation";

import { NavGroup, type NavItem, NavMenuItems } from "@/components/nav-groups";

export const NAV_SECONDARY_ITEMS: readonly NavItem[] = [
  { href: "/settings", title: "Settings", icon: Settings2 },
  { href: null, title: "Get Help", icon: LifeBuoy },
  { href: null, title: "Search", icon: Search },
];

export function NavSecondary() {
  const pathname = usePathname();

  return (
    <NavGroup className="mt-auto">
      <NavMenuItems items={NAV_SECONDARY_ITEMS} pathname={pathname} />
    </NavGroup>
  );
}
