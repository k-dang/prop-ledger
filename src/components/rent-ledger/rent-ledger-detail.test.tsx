// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-utils";
import { deleteRentEvent, recordRentEvent } from "@/lib/actions";
import type { RentLedger } from "@/lib/rent-ledger";

vi.mock("@/lib/actions", () => ({
  createLease: vi.fn(),
  deleteLease: vi.fn(),
  recordRentEvent: vi.fn(),
  deleteRentEvent: vi.fn(),
}));
vi.mock("./lease-document-upload", () => ({ uploadLeaseDocument: vi.fn() }));

import { uploadLeaseDocument } from "./lease-document-upload";
import {
  LeasesPanel,
  RentActivityCard,
  RentPaymentPanel,
} from "./rent-ledger-detail";

afterEach(() => {
  cleanup();
  vi.mocked(uploadLeaseDocument).mockReset();
  vi.mocked(recordRentEvent).mockReset();
  vi.mocked(deleteRentEvent).mockReset();
});

const ledger: RentLedger = {
  property: {
    id: "property-1",
    name: "Test property",
    line1: "1 Test Street",
    line2: null,
    municipality: "Toronto",
    province: "ON",
    postalCode: "M1M 1M1",
    acquisitionDate: "2026-01-01",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    setupDraft: null,
  },
  units: [
    {
      id: "unit-1",
      propertyId: "property-1",
      label: "Unit 1",
      unitType: "apartment",
    },
  ],
  leases: [
    {
      id: "lease-1",
      unitId: "unit-1",
      tenantName: "Test tenant",
      startDate: "2026-01-01",
      endDate: null,
      rentAmount: 2000,
      rentFrequency: "monthly",
    },
  ],
  rentEvents: [],
  documents: [
    {
      id: "document-1",
      propertyId: "property-1",
      fileName: "lease.pdf",
      documentType: "lease",
      storageUrl: "https://example.com/lease.pdf",
      vendor: null,
      documentDate: null,
      amount: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      links: [
        {
          id: "document-link-1",
          documentId: "document-1",
          targetType: "lease",
          targetId: "lease-1",
        },
      ],
    },
  ],
};

describe("lease document controls", () => {
  it("places the upload action alongside the linked lease documents", () => {
    const markup = renderToStaticMarkup(<LeasesPanel ledger={ledger} />);

    expect(markup).toContain('type="file"');
    expect(markup).toContain("Upload document");
    expect(markup).toContain('href="https://example.com/lease.pdf"');
    expect(markup).toContain("Lease documents for Test tenant");
  });

  it("opens the picker and uploads its selection without a submit step", async () => {
    let finish!: (result: ActionResult) => void;
    vi.mocked(uploadLeaseDocument).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<LeasesPanel ledger={ledger} />);
    const picker = screen.getByLabelText(
      "Choose a lease document for Test tenant",
    ) as HTMLInputElement;
    const click = vi.spyOn(picker, "click");
    fireEvent.click(screen.getByRole("button", { name: "Upload document" }));
    expect(click).toHaveBeenCalledOnce();

    const file = new File(["signed lease"], "signed.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(picker, { target: { files: [file] } });
    expect(uploadLeaseDocument).toHaveBeenCalledOnce();
    const [propertyId, leaseId, data] =
      vi.mocked(uploadLeaseDocument).mock.calls[0];
    expect([propertyId, leaseId, data.get("file")]).toEqual([
      "property-1",
      "lease-1",
      file,
    ]);
    expect(screen.getByRole("status").textContent).toContain(
      "Uploading signed.pdf",
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Upload document",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    await act(async () => finish({ ok: true }));
    expect(screen.getByRole("status").textContent).toContain(
      "signed.pdf added to this lease.",
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Upload document",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    expect(picker.value).toBe("");
    expect(screen.getByRole("link", { name: "lease.pdf" })).toBeTruthy();
  });

  it("retains a failed file for retry and allows selecting it again after success", async () => {
    vi.mocked(uploadLeaseDocument)
      .mockResolvedValueOnce({
        ok: false,
        error: "Connection lost. Try again.",
      })
      .mockResolvedValue({ ok: true });
    render(<LeasesPanel ledger={ledger} />);
    const picker = screen.getByLabelText(
      "Choose a lease document for Test tenant",
    );
    const file = new File(["signed lease"], "signed.pdf", {
      type: "application/pdf",
    });
    await act(async () =>
      fireEvent.change(picker, { target: { files: [file] } }),
    );
    expect(screen.getByRole("status").textContent).toContain(
      "Connection lost. Try again.",
    );
    expect(screen.getByRole("link", { name: "lease.pdf" })).toBeTruthy();

    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Retry upload" })),
    );
    expect(vi.mocked(uploadLeaseDocument).mock.calls[1][2].get("file")).toBe(
      file,
    );
    expect(screen.getByRole("status").textContent).toContain(
      "added to this lease",
    );
    expect(screen.queryByRole("button", { name: "Retry upload" })).toBeNull();

    await act(async () =>
      fireEvent.change(picker, { target: { files: [file] } }),
    );
    expect(uploadLeaseDocument).toHaveBeenCalledTimes(3);
  });

  it("uploads a dropped file once and rejects multiple files or invalid evidence", async () => {
    let finish!: (result: ActionResult) => void;
    vi.mocked(uploadLeaseDocument).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<LeasesPanel ledger={ledger} />);
    const zone = screen.getByRole("region", {
      name: "Lease documents for Test tenant",
    });
    const file = new File(["lease"], "lease.png", { type: "image/png" });
    const dataTransfer = { types: ["Files"], files: [file] };
    fireEvent.drop(zone, {
      dataTransfer: { ...dataTransfer, files: [file, file] },
    });
    expect(screen.getByRole("status").textContent).toContain(
      "Choose one document at a time.",
    );
    fireEvent.drop(zone, {
      dataTransfer: {
        ...dataTransfer,
        files: [new File(["text"], "lease.txt", { type: "text/plain" })],
      },
    });
    expect(screen.getByRole("status").textContent).toContain(
      "Evidence files must be PDF or image files.",
    );
    expect(uploadLeaseDocument).not.toHaveBeenCalled();

    act(() => {
      fireEvent.drop(zone, { dataTransfer });
      fireEvent.drop(zone, { dataTransfer });
    });
    expect(uploadLeaseDocument).toHaveBeenCalledOnce();
    expect(vi.mocked(uploadLeaseDocument).mock.calls[0][2].get("file")).toBe(
      file,
    );
    await act(async () => finish({ ok: true }));
    expect(screen.getByRole("status").textContent).toContain(
      "lease.png added to this lease.",
    );
  });

  it("summarises the leases and offers the add action", () => {
    const markup = renderToStaticMarkup(<LeasesPanel ledger={ledger} />);

    expect(markup).toContain("1 lease · 1 open-ended · 1 document");
    expect(markup).toContain("Save lease");
  });
});

describe("rent payment defaults", () => {
  it("selects the sole tenant and suggests lease rent and today's date", () => {
    const markup = renderToStaticMarkup(
      <RentPaymentPanel ledger={ledger} year={2026} today="2026-10-03" />,
    );
    expect(markup).toContain('name="leaseId" value="lease-1"');
    expect(markup).toContain('value="2000.00"');
    expect(markup).toContain('value="2026-10-03"');
    expect(markup).toContain("Record $2,000.00");
  });

  it("requires a tenant choice when more than one lease is recorded", () => {
    const multiple = {
      ...ledger,
      leases: [
        ...ledger.leases,
        { ...ledger.leases[0], id: "lease-2", tenantName: "Another tenant" },
      ],
    };
    const markup = renderToStaticMarkup(
      <RentPaymentPanel ledger={multiple} year={2026} today="2026-10-03" />,
    );
    expect(markup).toContain("Select a tenant");
    expect(markup).not.toContain('value="2000.00"');
    expect(markup).toContain('disabled=""');
  });

  it("leaves the payment date blank when viewing a different tax year", () => {
    const markup = renderToStaticMarkup(
      <RentPaymentPanel ledger={ledger} year={2025} today="2026-10-03" />,
    );
    expect(markup).not.toContain('value="2026-10-03"');
    expect(markup).toContain("Choose the date you received rent in 2025.");
  });
});

describe("rent payment deletion", () => {
  const ledgerWithPayment: RentLedger = {
    ...ledger,
    rentEvents: [
      {
        id: "event-1",
        propertyId: "property-1",
        leaseId: "lease-1",
        type: "payment",
        date: "2026-09-20",
        amount: 2400,
        periodStart: null,
        periodEnd: null,
        memo: null,
      },
    ],
  };

  it("holds the delete behind a confirmation instead of deleting at once", async () => {
    vi.mocked(deleteRentEvent).mockResolvedValue({ ok: true });
    render(<RentActivityCard ledger={ledgerWithPayment} year={2026} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete rent payment from 2026-09-20",
      }),
    );
    expect(vi.mocked(deleteRentEvent)).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeTruthy();

    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Delete payment" })),
    );
    expect(vi.mocked(deleteRentEvent)).toHaveBeenCalledOnce();
    expect(vi.mocked(deleteRentEvent)).toHaveBeenCalledWith(
      "property-1",
      "event-1",
    );
  });

  it("deletes nothing when the confirmation is dismissed", () => {
    vi.mocked(deleteRentEvent).mockResolvedValue({ ok: true });
    render(<RentActivityCard ledger={ledgerWithPayment} year={2026} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete rent payment from 2026-09-20",
      }),
    );
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    expect(vi.mocked(deleteRentEvent)).not.toHaveBeenCalled();
  });
});

describe("rent payment feedback", () => {
  it("shows a receipt outside the form and replaces it on the next successful save", async () => {
    let finish!: (result: ActionResult) => void;
    vi.mocked(recordRentEvent)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValue({ ok: true });
    render(
      <>
        <RentPaymentPanel ledger={ledger} year={2026} today="2026-10-12" />
        <Toaster />
      </>,
    );
    const form = screen
      .getByRole("button", { name: "Record $2,000.00" })
      .closest("form");
    if (!form) throw new Error("Rent form was not rendered");

    fireEvent.submit(form);
    expect(screen.queryByText(/Recorded \$/)).toBeNull();
    await act(async () => finish({ ok: true }));
    const firstReceipt = screen.getByText(
      "Recorded $2,000.00 for Test tenant on 2026-10-12.",
    );
    expect(firstReceipt.closest('[data-slot="card"]')).toBeNull();
    expect(firstReceipt.closest('[data-slot="toast"]')).toBeTruthy();
    expect(
      (
        screen.getByRole("spinbutton", {
          name: "Amount received",
        }) as HTMLInputElement
      ).value,
    ).toBe("");

    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Amount received" }),
      { target: { value: "1500" } },
    );
    fireEvent.change(screen.getByLabelText("Date received"), {
      target: { value: "2025-12-20" },
    });
    await act(async () => fireEvent.submit(form));
    expect(
      screen.queryByText("Recorded $2,000.00 for Test tenant on 2026-10-12."),
    ).toBeNull();
    expect(
      screen.getByText("Recorded $1,500.00 for Test tenant on 2025-12-20."),
    ).toBeTruthy();
    expect(document.querySelectorAll('[data-slot="toast"]')).toHaveLength(1);
    expect(
      screen
        .getByRole("link", { name: "View 2025 payments" })
        .getAttribute("href"),
    ).toBe("/properties/property-1?year=2025");
    fireEvent.keyDown(document, { key: "F6" });
    expect(screen.getByRole("button", { name: "Close toast" })).toBeTruthy();
  });

  it("keeps a failed save inline without showing a success receipt", async () => {
    vi.mocked(recordRentEvent).mockResolvedValue({
      ok: false,
      error: "Connection lost. Try again.",
    });
    render(
      <>
        <RentPaymentPanel ledger={ledger} year={2026} today="2026-10-12" />
        <Toaster />
      </>,
    );
    const form = screen
      .getByRole("button", { name: "Record $2,000.00" })
      .closest("form");
    if (!form) throw new Error("Rent form was not rendered");
    await act(async () => fireEvent.submit(form));
    expect(
      screen.getByText("Connection lost. Try again.").closest("form"),
    ).toBe(form);
    expect(document.querySelector('[data-slot="toast"]')).toBeNull();
    expect(
      (
        screen.getByRole("spinbutton", {
          name: "Amount received",
        }) as HTMLInputElement
      ).value,
    ).toBe("2000.00");
  });
});
