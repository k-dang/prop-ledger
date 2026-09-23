import { describe, expect, it } from "vitest";

import type { Lease, RentEvent } from "@/db/schema";
import {
  calculateExpectedRent,
  compareLeaseRent,
  type DocumentWithLinks,
  getLeaseDocuments,
  summarizeRentLedger,
} from "./rent-ledger";

function makeLease(lease: Partial<Lease> & Pick<Lease, "id">): Lease {
  return {
    unitId: "unit-1",
    tenantName: "Test tenant",
    startDate: "2026-01-01",
    endDate: null,
    rentAmount: 2000,
    rentFrequency: "monthly",
    ...lease,
  };
}

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

describe("expected rent", () => {
  it("charges the full year for a monthly lease active all year", () => {
    expect(
      calculateExpectedRent(
        makeLease({ id: "lease-1", startDate: "2025-06-01", endDate: null }),
        2026,
      ),
    ).toEqual(24000);
  });

  it("prorates a monthly lease that starts mid-month", () => {
    // 17 of 31 January days at $2000/mo.
    expect(
      calculateExpectedRent(
        makeLease({
          id: "lease-1",
          startDate: "2026-01-15",
          endDate: "2026-12-31",
        }),
        2026,
      ),
    ).toEqual(23096.77);
  });

  it("prorates a monthly lease that ends mid-month", () => {
    // Jan + Feb at $2000/mo plus 10 of 31 March days.
    expect(
      calculateExpectedRent(
        makeLease({
          id: "lease-1",
          startDate: "2026-01-01",
          endDate: "2026-03-10",
        }),
        2026,
      ),
    ).toEqual(4645.16);
  });

  it("uses the leap-year February denominator", () => {
    expect(
      calculateExpectedRent(
        makeLease({
          id: "lease-1",
          startDate: "2024-02-01",
          endDate: "2024-02-29",
          rentAmount: 2900,
        }),
        2024,
      ),
    ).toEqual(2900);
  });

  it("prorates weekly leases by the 7-day rate", () => {
    // 31 January days at $500/week.
    expect(
      calculateExpectedRent(
        makeLease({
          id: "lease-1",
          startDate: "2026-01-01",
          endDate: "2026-01-31",
          rentAmount: 500,
          rentFrequency: "weekly",
        }),
        2026,
      ),
    ).toEqual(2214.29);
  });

  it("prorates biweekly leases by the 14-day rate", () => {
    // 28 February days at $1000/biweekly = exactly two periods.
    expect(
      calculateExpectedRent(
        makeLease({
          id: "lease-1",
          startDate: "2026-02-01",
          endDate: "2026-02-28",
          rentAmount: 1000,
          rentFrequency: "biweekly",
        }),
        2026,
      ),
    ).toEqual(2000);
  });

  it("intersects the lease with the selected tax year", () => {
    const lease = makeLease({
      id: "lease-1",
      startDate: "2025-12-15",
      endDate: "2026-01-14",
    });

    expect(calculateExpectedRent(lease, 2025)).toEqual(1096.77);
    expect(calculateExpectedRent(lease, 2026)).toEqual(903.23);
  });

  it("returns zero when the lease has no overlap with the year", () => {
    expect(
      calculateExpectedRent(
        makeLease({
          id: "lease-1",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
        }),
        2026,
      ),
    ).toEqual(0);
  });

  it("treats lease boundaries as inclusive", () => {
    expect(
      calculateExpectedRent(
        makeLease({
          id: "lease-1",
          startDate: "2026-03-10",
          endDate: "2026-03-10",
          rentAmount: 3100,
        }),
        2026,
      ),
    ).toEqual(100);
  });
});

describe("lease rent comparison", () => {
  const lease = makeLease({ id: "lease-1" });

  it("flags a shortfall when payments fall short of expected rent", () => {
    const [comparison] = compareLeaseRent(
      [lease],
      [makeEvent({ id: "p1", amount: 20000, date: "2026-06-01" })],
      2026,
    );

    expect(comparison).toEqual({
      leaseId: "lease-1",
      year: 2026,
      expectedRent: 24000,
      paymentsReceived: 20000,
      difference: -4000,
      status: "shortfall",
    });
  });

  it("shows a shortfall with no linked payments", () => {
    const [comparison] = compareLeaseRent([lease], [], 2026);

    expect(comparison.paymentsReceived).toEqual(0);
    expect(comparison.difference).toEqual(-24000);
    expect(comparison.status).toEqual("shortfall");
  });

  it("labels an exact match as paid in full", () => {
    const [comparison] = compareLeaseRent(
      [lease],
      [makeEvent({ id: "p1", amount: 24000, date: "2026-06-01" })],
      2026,
    );

    expect(comparison.difference).toEqual(0);
    expect(comparison.status).toEqual("paid-in-full");
  });

  it("labels an overpayment as prepaid", () => {
    const [comparison] = compareLeaseRent(
      [lease],
      [makeEvent({ id: "p1", amount: 25000, date: "2026-06-01" })],
      2026,
    );

    expect(comparison.difference).toEqual(1000);
    expect(comparison.status).toEqual("prepaid");
  });

  it("ignores unlinked payments and payments from other years", () => {
    const [comparison] = compareLeaseRent(
      [lease],
      [
        makeEvent({ id: "p1", amount: 2000, date: "2026-01-05" }),
        makeEvent({
          id: "p2",
          amount: 5000,
          date: "2026-02-05",
          leaseId: "lease-2",
        }),
        makeEvent({
          id: "p3",
          amount: 5000,
          date: "2026-03-05",
          leaseId: null,
        }),
        makeEvent({ id: "p4", amount: 5000, date: "2025-12-05" }),
      ],
      2026,
    );

    expect(comparison.paymentsReceived).toEqual(2000);
  });

  it("rounds fractional payment sums to cents", () => {
    const [comparison] = compareLeaseRent(
      [makeLease({ id: "lease-1", rentAmount: 1000 })],
      [
        makeEvent({ id: "p1", amount: 100.005, date: "2026-01-05" }),
        makeEvent({ id: "p2", amount: 100.005, date: "2026-02-05" }),
      ],
      2026,
    );

    expect(comparison.paymentsReceived).toEqual(200.01);
  });
});
