// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

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

describe("NavUser workspace footer", () => {
  it("renders as static text with no dropdown or duplicate Settings", () => {
    renderNavUser();
    expect(screen.getByText("Rental Workspace")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.queryByText("Settings")).toBeNull();
  });
});
