import { describe, expect, it } from "vitest";

import type { RentEvent } from "@/db/schema";
import {
  type DocumentWithLinks,
  getLeaseDocuments,
  summarizeRentLedger,
} from "./rent-ledger";

function makeEvent(
  event: Partial<RentEvent> & Pick<RentEvent, "id" | "amount">,
): RentEvent {
  return {
    propertyId: "property-1",
    leaseId: "lease-1",
    type: "payment",
    date: "2026-01-01",
    periodStart: null,
    periodEnd: null,
    memo: null,
    ...event,
  };
}

describe("rent ledger summary", () => {
  const events: RentEvent[] = [
    makeEvent({ id: "p0", amount: 1800, date: "2025-12-05" }),
    makeEvent({ id: "p1", amount: 2000, date: "2026-01-05" }),
    makeEvent({ id: "p2", amount: 2100, date: "2026-02-05" }),
  ];

  it("uses rent payments received in the selected tax year as gross rent", () => {
    const summary = summarizeRentLedger(events, 2026);

    expect(summary).toEqual({
      year: 2026,
      grossRent: 4100,
      paymentsReceived: 4100,
      grossRentalIncome: 4100,
      paymentCount: 2,
    });
  });

  it("excludes payments from other tax years", () => {
    expect(summarizeRentLedger(events, 2025)).toEqual({
      year: 2025,
      grossRent: 1800,
      paymentsReceived: 1800,
      grossRentalIncome: 1800,
      paymentCount: 1,
    });
  });
});

describe("lease document links", () => {
  const documents: DocumentWithLinks[] = [
    {
      id: "doc-1",
      propertyId: "property-1",
      fileName: "lease-agreement.pdf",
      documentType: "lease",
      storageUrl: null,
      vendor: null,
      documentDate: null,
      amount: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      links: [
        {
          id: "l1",
          documentId: "doc-1",
          targetType: "lease",
          targetId: "lease-1",
        },
      ],
    },
    {
      id: "doc-2",
      propertyId: "property-1",
      fileName: "receipt.pdf",
      documentType: "receipt",
      storageUrl: null,
      vendor: null,
      documentDate: null,
      amount: null,
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
      links: [
        {
          id: "l2",
          documentId: "doc-2",
          targetType: "rent_event",
          targetId: "evt-1",
        },
      ],
    },
  ];

  it("surfaces only the documents linked to the lease", () => {
    const linked = getLeaseDocuments(documents, "lease-1");

    expect(linked.map((document) => document.fileName)).toEqual([
      "lease-agreement.pdf",
    ]);
  });

  it("returns nothing when no document links the lease", () => {
    expect(getLeaseDocuments(documents, "lease-999")).toEqual([]);
  });
});
