import { describe, expect, it } from "vitest";

import type { Lease, RentEvent } from "@/db/schema";
import {
  computeLeaseBalances,
  type DocumentWithLinks,
  generateRentCharges,
  getLeaseDocuments,
  summarizeArrears,
  summarizeRentLedger,
} from "./rent-ledger";

function makeLease(lease: Partial<Lease> & Pick<Lease, "id">): Lease {
  return {
    unitId: "unit-1",
    tenantName: "Sam Tenant",
    startDate: "2026-01-01",
    endDate: null,
    rentAmount: 2000,
    rentFrequency: "monthly",
    ...lease,
  };
}

function makeEvent(
  event: Partial<RentEvent> & Pick<RentEvent, "id" | "type" | "amount">,
): RentEvent {
  return {
    propertyId: "property-1",
    leaseId: "lease-1",
    date: "2026-01-01",
    periodStart: null,
    periodEnd: null,
    memo: null,
    ...event,
  };
}

describe("rent charge schedule generation", () => {
  it("bills a full charge for each whole month", () => {
    const charges = generateRentCharges(
      makeLease({ id: "lease-1", startDate: "2026-01-01" }),
      "2026-03-31",
    );

    expect(charges).toEqual([
      {
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        date: "2026-01-01",
        amount: 2000,
      },
      {
        periodStart: "2026-02-01",
        periodEnd: "2026-02-28",
        date: "2026-02-01",
        amount: 2000,
      },
      {
        periodStart: "2026-03-01",
        periodEnd: "2026-03-31",
        date: "2026-03-01",
        amount: 2000,
      },
    ]);
  });

  it("prorates a partial first month by day count", () => {
    const charges = generateRentCharges(
      makeLease({ id: "lease-1", startDate: "2026-01-16", rentAmount: 3100 }),
      "2026-02-28",
    );

    // January: 16 active days of 31 -> 3100 * 16 / 31 = 1600.
    expect(charges[0]).toEqual({
      periodStart: "2026-01-16",
      periodEnd: "2026-01-31",
      date: "2026-01-16",
      amount: 1600,
    });
    expect(charges[1]?.amount).toBe(3100);
  });

  it("stops at the lease end date and prorates the final month", () => {
    const charges = generateRentCharges(
      makeLease({
        id: "lease-1",
        startDate: "2026-01-01",
        endDate: "2026-02-15",
      }),
      "2026-12-31",
    );

    expect(charges).toHaveLength(2);
    // February: 15 active days of 28 -> 2000 * 15 / 28 = 1071.43.
    expect(charges[1]).toEqual({
      periodStart: "2026-02-01",
      periodEnd: "2026-02-15",
      date: "2026-02-01",
      amount: 1071.43,
    });
  });

  it("bills weekly leases per 7-day interval and prorates a cut-off final week", () => {
    const charges = generateRentCharges(
      makeLease({
        id: "lease-1",
        startDate: "2026-01-01",
        rentFrequency: "weekly",
        rentAmount: 700,
      }),
      "2026-01-17",
    );

    expect(charges).toHaveLength(3);
    expect(charges[0]).toEqual({
      periodStart: "2026-01-01",
      periodEnd: "2026-01-07",
      date: "2026-01-01",
      amount: 700,
    });
    // Third week is cut to 3 of 7 days -> 700 * 3 / 7 = 300.
    expect(charges[2]).toEqual({
      periodStart: "2026-01-15",
      periodEnd: "2026-01-17",
      date: "2026-01-15",
      amount: 300,
    });
  });

  it("returns no charges when the window precedes the lease start", () => {
    const charges = generateRentCharges(
      makeLease({ id: "lease-1", startDate: "2026-05-01" }),
      "2026-04-30",
    );

    expect(charges).toEqual([]);
  });
});

describe("lease balances and arrears", () => {
  const events: RentEvent[] = [
    makeEvent({ id: "c1", type: "charge", amount: 2000, date: "2026-01-01" }),
    makeEvent({ id: "c2", type: "charge", amount: 2000, date: "2026-02-01" }),
    makeEvent({ id: "p1", type: "payment", amount: 2000, date: "2026-01-05" }),
    makeEvent({ id: "cr1", type: "credit", amount: 100, date: "2026-02-03" }),
    makeEvent({ id: "w1", type: "writeoff", amount: 150, date: "2026-02-10" }),
    // Other income never affects a tenant balance.
    makeEvent({
      id: "oi1",
      type: "other_income",
      amount: 80,
      leaseId: null,
      date: "2026-02-15",
    }),
  ];

  it("nets charges against payments, credits, and write-offs", () => {
    const balance = computeLeaseBalances(events).get("lease-1");

    expect(balance).toEqual({
      leaseId: "lease-1",
      charged: 4000,
      paid: 2000,
      credited: 100,
      writtenOff: 150,
      balance: 1750,
    });
  });

  it("reports arrears by tenant and unit, largest balance first", () => {
    const leases = [
      makeLease({ id: "lease-1", tenantName: "Sam Tenant", unitId: "unit-1" }),
      makeLease({ id: "lease-2", tenantName: "Pat Renter", unitId: "unit-2" }),
    ];
    const twoLeaseEvents = [
      ...events,
      makeEvent({ id: "c3", type: "charge", amount: 500, leaseId: "lease-2" }),
      makeEvent({ id: "p2", type: "payment", amount: 500, leaseId: "lease-2" }),
    ];

    const arrears = summarizeArrears(leases, twoLeaseEvents);

    expect(
      arrears.map((row) => [row.tenantName, row.unitId, row.balance]),
    ).toEqual([
      ["Sam Tenant", "unit-1", 1750],
      ["Pat Renter", "unit-2", 0],
    ]);
  });
});

describe("rent ledger summary", () => {
  const events: RentEvent[] = [
    makeEvent({ id: "c1", type: "charge", amount: 2000, date: "2025-12-01" }),
    makeEvent({ id: "p0", type: "payment", amount: 2000, date: "2025-12-05" }),
    makeEvent({ id: "c2", type: "charge", amount: 2000, date: "2026-01-01" }),
    makeEvent({ id: "c3", type: "charge", amount: 2000, date: "2026-02-01" }),
    makeEvent({ id: "p1", type: "payment", amount: 2000, date: "2026-01-05" }),
    makeEvent({ id: "cr1", type: "credit", amount: 100, date: "2026-02-03" }),
    makeEvent({ id: "w1", type: "writeoff", amount: 150, date: "2026-03-10" }),
    makeEvent({
      id: "oi1",
      type: "other_income",
      amount: 120,
      leaseId: null,
      date: "2026-04-01",
    }),
  ];

  it("scopes income to the year and carries arrears to year end", () => {
    const summary = summarizeRentLedger(events, 2026);

    expect(summary).toEqual({
      year: 2026,
      grossRent: 4000,
      otherIncome: 120,
      paymentsReceived: 2000,
      credits: 100,
      writeoffs: 150,
      grossRentalIncome: 4120,
      // Cumulative through 2026-12-31: charges 6000 - payments 4000
      //   - credit 100 - writeoff 150 = 1750.
      arrearsAtYearEnd: 1750,
    });
  });

  it("excludes the prior year's activity from gross rent", () => {
    expect(summarizeRentLedger(events, 2025).grossRent).toBe(2000);
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
