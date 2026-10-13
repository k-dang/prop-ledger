// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySetupForm } from "@/lib/property-setup";
import { OwnershipStep } from "./setup-steps";

afterEach(() => {
  cleanup();
});

describe("ownership switch confirmation", () => {
  function multiOwnerForm() {
    return {
      ...emptySetupForm(),
      ownerMode: "multi" as const,
      owners: [
        { id: "owner-1", name: "Aisha", share: "40" },
        { id: "owner-2", name: "Ben", share: "30" },
        { id: "owner-3", name: "Cara", share: "30" },
      ],
    };
  }

  it("holds the switch behind a confirmation instead of applying it", () => {
    const onChange = vi.fn();
    render(
      <OwnershipStep form={multiOwnerForm()} errors={{}} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Just me/ }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Switch" }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0]).toMatchObject({ ownerMode: "solo" });
  });

  it("keeps the current mode when the confirmation is dismissed", () => {
    const onChange = vi.fn();
    render(
      <OwnershipStep form={multiOwnerForm()} errors={{}} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Just me/ }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    expect(onChange).not.toHaveBeenCalled();
  });
});
