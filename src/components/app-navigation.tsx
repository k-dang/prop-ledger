"use client";

import { FileText, Landmark, LayoutDashboard, ReceiptText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

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

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="w-full lg:w-auto">
      <ul className="flex gap-1 overflow-x-auto rounded-md border bg-background p-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.isActive(pathname);

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-sm px-3 font-medium text-sm transition-colors",
                  "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
