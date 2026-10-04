import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { RentLedger } from "@/lib/rent-ledger";

vi.mock("@/lib/actions", () => ({
  createLease: vi.fn(),
  deleteLease: vi.fn(),
  recordRentEvent: vi.fn(),
  deleteRentEvent: vi.fn(),
}));
vi.mock("./lease-document-upload", () => ({ uploadLeaseDocument: vi.fn() }));

import { RentLedgerDetail, RentPaymentPanel } from "./rent-ledger-detail";

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
  it("lets a landlord choose and upload a lease document", () => {
    const markup = renderToStaticMarkup(
      <RentLedgerDetail
        ledger={ledger}
        year={2026}
        today="2026-10-03"
        defaultOpenLeases
      />,
    );

    expect(markup).toContain('type="file"');
    expect(markup).toContain("Add document");
    expect(markup).toContain("flex flex-col gap-2 sm:flex-row sm:items-center");
    expect(markup).toContain("flex flex-col gap-3");
    expect(markup).toContain("m-0 flex flex-col gap-1 p-0");
    expect(markup).toContain("flex items-center gap-2 text-sm leading-5");
    expect(markup).toContain('class="m-0 grid gap-2"');
    expect(markup).not.toContain("Add link");
    expect(markup).not.toContain("link a document already online");
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
