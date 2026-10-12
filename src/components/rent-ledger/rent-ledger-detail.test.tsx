// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ActionResult } from "@/lib/action-utils";
import type { RentLedger } from "@/lib/rent-ledger";

vi.mock("@/lib/actions", () => ({
  createLease: vi.fn(),
  deleteLease: vi.fn(),
  recordRentEvent: vi.fn(),
  deleteRentEvent: vi.fn(),
}));
vi.mock("./lease-document-upload", () => ({ uploadLeaseDocument: vi.fn() }));

import { uploadLeaseDocument } from "./lease-document-upload";
import { LeasesPanel, RentPaymentPanel } from "./rent-ledger-detail";

afterEach(() => {
  cleanup();
  vi.mocked(uploadLeaseDocument).mockReset();
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
    expect(markup).toContain("Add lease");
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
