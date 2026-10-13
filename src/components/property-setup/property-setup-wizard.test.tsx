// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { Activity, type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { push, saveDraft, completeSetup } = vi.hoisted(() => ({
  push: vi.fn(),
  saveDraft: vi.fn(),
  completeSetup: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({
  default: ({
    href,
    onClick,
    onNavigate,
    ...props
  }: ComponentProps<"a"> & {
    onNavigate?: (event: { preventDefault: () => void }) => void;
  }) => (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !event.ctrlKey && !event.metaKey) {
          onNavigate?.({ preventDefault: () => event.preventDefault() });
        }
        event.preventDefault();
      }}
    />
  ),
}));
vi.mock("@/lib/property-setup-actions", () => ({
  savePropertySetupDraft: saveDraft,
  completePropertySetup: completeSetup,
}));
vi.mock("@/components/rent-ledger/lease-document-upload", () => ({
  uploadLeaseDocument: vi.fn(),
}));

import { uploadLeaseDocument } from "@/components/rent-ledger/lease-document-upload";
import type { ActionResult } from "@/lib/action-utils";
import { emptySetupForm, type SetupForm } from "@/lib/property-setup";
import { PropertySetupWizard } from "./property-setup-wizard";

const TODAY = "2026-10-12";

function completeForm(): SetupForm {
  return {
    ...emptySetupForm(),
    property: {
      name: "Test property",
      line1: "100 King Street W",
      line2: "",
      municipality: "Hamilton",
      province: "ON",
      postalCode: "L8P 1A1",
      acquisitionDate: "2021-04-15",
    },
    ownerMode: "solo",
    owners: [{ id: "owner", name: "Kevin", share: "100" }],
    layout: "house",
    units: [
      {
        id: "unit",
        label: "Whole house",
        unitType: "House",
        occupancy: "vacant",
        tenantName: "",
        startDate: "",
        rentAmount: "",
        rentFrequency: "monthly",
      },
    ],
  };
}

function wizard(
  initialForm: SetupForm,
  mode: "visible" | "hidden" = "visible",
  propertyId: string | null = null,
  setupFinished = false,
) {
  return (
    <Activity mode={mode}>
      <PropertySetupWizard
        propertyId={propertyId}
        setupFinished={setupFinished}
        initialForm={initialForm}
        cancelHref="/dashboard"
        today={TODAY}
      />
    </Activity>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  saveDraft.mockResolvedValue({ ok: true, propertyId: "property" });
  completeSetup.mockResolvedValue({
    ok: true,
    propertyId: "property",
    leaseIdByUnit: {},
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("setup wizard lifecycle", () => {
  it.each(["ctrlKey", "metaKey"])(
    "preserves current-tab answers on a cancel click with %s",
    (modifier) => {
      render(wizard(completeForm()));
      fireEvent.change(screen.getByLabelText("Property name"), {
        target: { value: "Unfinished edit" },
      });
      fireEvent.click(screen.getByRole("link", { name: "Cancel" }), {
        [modifier]: true,
      });
      expect(
        (screen.getByLabelText("Property name") as HTMLInputElement).value,
      ).toBe("Unfinished edit");
      expect(screen.queryByRole("alertdialog")).toBeNull();
    },
  );

  it("preserves unfinished answers across an Activity detour, then discards them on cancel", () => {
    const form = completeForm();
    const { rerender } = render(wizard(form));
    fireEvent.change(screen.getByLabelText("Property name"), {
      target: { value: "Unfinished edit" },
    });
    rerender(wizard(form, "hidden"));
    rerender(wizard(form));
    expect(
      (screen.getByLabelText("Property name") as HTMLInputElement).value,
    ).toBe("Unfinished edit");

    fireEvent.click(screen.getByRole("link", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Leave" }));
    expect(push).toHaveBeenCalledWith("/dashboard");
    rerender(wizard(form, "hidden"));
    rerender(wizard(form));
    expect(
      (screen.getByLabelText("Property name") as HTMLInputElement).value,
    ).toBe("Test property");
  });

  it("keeps the edited answers when cancel is declined", () => {
    render(wizard(completeForm()));
    fireEvent.change(screen.getByLabelText("Property name"), {
      target: { value: "Unfinished edit" },
    });
    fireEvent.click(screen.getByRole("link", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    expect(
      (screen.getByLabelText("Property name") as HTMLInputElement).value,
    ).toBe("Unfinished edit");
    expect(push).not.toHaveBeenCalled();
  });

  it("resets a new-property form after saving while retaining the submitted answers in the draft", async () => {
    const form = completeForm();
    const { rerender } = render(wizard(form));
    fireEvent.change(screen.getByLabelText("Property name"), {
      target: { value: "Saved property" },
    });
    fireEvent.click(
      within(
        screen.getByRole("navigation", { name: "Setup progress" }),
      ).getByRole("button", { name: /^Ownership/ }),
    );
    await act(async () =>
      fireEvent.click(
        screen.getByRole("button", { name: "Save and finish later" }),
      ),
    );
    expect(saveDraft).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        property: expect.objectContaining({ name: "Saved property" }),
      }),
    );
    expect(push).toHaveBeenCalledWith("/properties/property");
    rerender(wizard(form, "hidden"));
    rerender(wizard(form));
    expect(
      (screen.getByLabelText("Property name") as HTMLInputElement).value,
    ).toBe("Test property");
  });

  it("returns to the saved answers when resuming a draft", async () => {
    const form = completeForm();
    const { rerender } = render(wizard(form, "visible", "property"));
    fireEvent.change(screen.getByLabelText("Property name"), {
      target: { value: "Saved edit" },
    });
    fireEvent.click(
      within(
        screen.getByRole("navigation", { name: "Setup progress" }),
      ).getByRole("button", { name: /^Ownership/ }),
    );
    await act(async () =>
      fireEvent.click(
        screen.getByRole("button", { name: "Save and finish later" }),
      ),
    );
    rerender(wizard(form, "hidden", "property"));
    rerender(wizard(form, "visible", "property"));
    expect(
      (screen.getByLabelText("Property name") as HTMLInputElement).value,
    ).toBe("Saved edit");
  });

  it("preserves answers and allows retry after a failed save", async () => {
    completeSetup.mockResolvedValueOnce({ ok: false, error: "Try again." });
    render(wizard(completeForm()));
    fireEvent.change(screen.getByLabelText("Property name"), {
      target: { value: "Keep this answer" },
    });
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Create property" })),
    );
    expect(screen.getByRole("alert").textContent).toContain("Try again.");
    expect(
      (screen.getByLabelText("Property name") as HTMLInputElement).value,
    ).toBe("Keep this answer");
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Create property" })),
    );
    expect(completeSetup).toHaveBeenCalledTimes(2);
    expect(push).toHaveBeenCalledOnce();
  });

  it("keeps uploading through the completion refresh, then clears failed-upload feedback on return", async () => {
    const form = completeForm();
    form.units[0] = {
      ...form.units[0],
      occupancy: "rented",
      tenantName: "Tenant",
      startDate: "2024-09-01",
      rentAmount: "2000",
    };
    completeSetup.mockResolvedValue({
      ok: true,
      propertyId: "property",
      leaseIdByUnit: { unit: "lease" },
    });
    const upload = Promise.withResolvers<ActionResult>();
    vi.mocked(uploadLeaseDocument).mockReturnValue(upload.promise);
    const { rerender } = render(wizard(form, "visible", "property"));
    fireEvent.click(
      within(
        screen.getByRole("navigation", { name: "Setup progress" }),
      ).getByRole("button", { name: /^Tenants/ }),
    );
    fireEvent.change(
      screen.getByLabelText(/Signed lease/, { selector: "input" }),
      {
        target: {
          files: [
            new File(["lease"], "lease.pdf", { type: "application/pdf" }),
          ],
        },
      },
    );
    fireEvent.click(
      within(
        screen.getByRole("navigation", { name: "Setup progress" }),
      ).getByRole("button", { name: /Review/ }),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Finish setup" })),
    );
    rerender(wizard(form, "visible", "property", true));
    expect(
      screen.getByRole("button", { name: "Uploading leases…" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Setup is finished" }),
    ).toBeNull();
    await act(async () =>
      upload.resolve({ ok: false, error: "Upload failed." }),
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "lease.pdf: Upload failed.",
    );
    expect(push).not.toHaveBeenCalled();
    rerender(wizard(form, "hidden", "property", true));
    rerender(wizard(form, "visible", "property", true));
    expect(
      screen.getByRole("heading", { name: "Setup is finished" }),
    ).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
