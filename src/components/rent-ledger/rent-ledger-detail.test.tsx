import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { RentLedger } from "@/lib/rent-ledger";
import { RentLedgerDetail } from "./rent-ledger-detail";

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
  documents: [],
};

describe("lease document controls", () => {
  it("lets a landlord choose and upload a lease document", () => {
    const markup = renderToStaticMarkup(
      <RentLedgerDetail
        ledger={ledger}
        year={2026}
        defaultOpenLeases
        onCreateLease={vi.fn()}
        onDeleteLease={vi.fn()}
        onRecordEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
        onAddLeaseDocument={vi.fn()}
        onUploadLeaseDocument={vi.fn()}
      />,
    );

    expect(markup).toContain('type="file"');
    expect(markup).toContain("Add document");
  });
});
