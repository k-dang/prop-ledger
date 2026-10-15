// @vitest-environment jsdom
// Guards against the Base UI MenuGroupContext crash when opening this menu.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { NavUser } from "@/components/nav-user";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

function renderNavUser() {
  return render(
    <TooltipProvider>
      <SidebarProvider>
        <NavUser />
      </SidebarProvider>
    </TooltipProvider>,
  );
}

describe("NavUser workspace menu", () => {
  it("opens the menu and shows Settings without throwing", async () => {
    renderNavUser();
    const trigger = screen.getByRole("button", {
      name: /rental workspace/i,
    });
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeTruthy();
    });
    const settingsLink = screen.getByText("Settings").closest("a");
    expect(settingsLink?.getAttribute("href")).toBe("/settings");
  });
});
