/**
 * Rent-ledger domain logic.
 *
 * Rent income is tracked as payments received. Leases provide tenant, unit,
 * rent amount, and document context; they do not generate expected rent rows.
 */
import type {
  Document,
  DocumentLink,
  Lease,
  NewLease,
  Property,
  RentEvent,
  Unit,
} from "@/db/schema";

export type {
  Lease,
  RentEvent,
  RentEventType,
  RentFrequency,
} from "@/db/schema";

/**
 * Form inputs for the rent-ledger server actions: insert shapes minus columns
 * the database fills in or the route context supplies.
 */
export type NewLeaseInput = Omit<NewLease, "id">;
export type NewRentEventInput = {
  type: "payment";
  leaseId: string;
  date: string;
  amount: number;
  memo?: string | null;
};
/** A document loaded with the links that attach it to other records. */
export type DocumentWithLinks = Document & { links: DocumentLink[] };

/**
 * The rent ledger for one property, loaded as an aggregate: the property row,
 * its units, every lease under those units, the rent payments, and the
 * documents uploaded against the property.
 */
export type RentLedger = {
  property: Property;
  units: Unit[];
  leases: Lease[];
  rentEvents: RentEvent[];
  documents: DocumentWithLinks[];
};

/**
 * A rent ledger summary scoped to one tax year. Gross rent is the rent received
 * from tenants during the year, matching the app's simple tax-recording flow.
 */
export type RentLedgerSummary = {
  year: number;
  grossRent: number;
  paymentsReceived: number;
  grossRentalIncome: number;
  paymentCount: number;
};

/**
 * Derived per-lease rent comparison for one tax year. Values are computed from
 * existing lease fields and payment events; nothing here is persisted.
 */
export type LeaseRentComparisonStatus =
  | "shortfall"
  | "paid-in-full"
  | "prepaid";

export type LeaseRentComparison = {
  leaseId: string;
  year: number;
  expectedRent: number;
  paymentsReceived: number;
  difference: number;
  status: LeaseRentComparisonStatus;
};

/** Display labels for the derived rent-comparison statuses. */
export const LEASE_RENT_COMPARISON_LABELS: Record<
  LeaseRentComparisonStatus,
  string
> = {
  shortfall: "Shortfall",
  "paid-in-full": "Paid in full",
  prepaid: "Prepaid",
};

/** Build the year-scoped rent summary for a property's recorded payments. */
export function summarizeRentLedger(
  events: RentEvent[],
  year: number,
): RentLedgerSummary {
  const yearPrefix = `${year}-`;
  const payments = events.filter(
    (event) => event.type === "payment" && event.date.startsWith(yearPrefix),
  );
  const paymentsReceived = roundMoney(
    payments.reduce((total, event) => total + event.amount, 0),
  );

  return {
    year,
    grossRent: paymentsReceived,
    paymentsReceived,
    grossRentalIncome: paymentsReceived,
    paymentCount: payments.length,
  };
}

/** The documents linked to a lease, found through their `lease` links. */
export function getLeaseDocuments(
  documents: DocumentWithLinks[],
  leaseId: string,
): DocumentWithLinks[] {
  return documents.filter((document) =>
    document.links.some(
      (link) => link.targetType === "lease" && link.targetId === leaseId,
    ),
  );
}

const moneyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

/** Format a dollar amount as Canadian currency for display. */
export function formatMoney(value: number): string {
  // Guard against non-finite inputs so a bad upstream amount renders as $0.00
  // rather than the literal "$NaN".
  return moneyFormatter.format(Number.isFinite(value) ? value : 0);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parse a `YYYY-MM-DD` date as a UTC midnight timestamp for day arithmetic. */
function parseIsoDay(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Count inclusive days between two UTC midnight timestamps. */
function inclusiveDaysBetween(startUtc: number, endUtc: number): number {
  return Math.round((endUtc - startUtc) / MS_PER_DAY) + 1;
}

/**
 * Expected rent for one lease during one tax year. Monthly rent is prorated by
 * active calendar days within each month; weekly and biweekly rent use a
 * day rate (amount / 7 or / 14) multiplied by active days. Lease boundaries
 * are inclusive; an open end date runs through December 31.
 */
export function calculateExpectedRent(
  lease: Pick<Lease, "rentAmount" | "rentFrequency" | "startDate" | "endDate">,
  year: number,
): number {
  const yearStart = Date.UTC(year, 0, 1);
  const yearEnd = Date.UTC(year, 11, 31);
  const leaseStart = parseIsoDay(lease.startDate);
  const leaseEnd =
    lease.endDate === null ? yearEnd : parseIsoDay(lease.endDate);
  const activeStart = Math.max(leaseStart, yearStart);
  const activeEnd = Math.min(leaseEnd, yearEnd);

  if (activeEnd < activeStart) {
    return 0;
  }

  if (lease.rentFrequency === "weekly" || lease.rentFrequency === "biweekly") {
    const periodDays = lease.rentFrequency === "weekly" ? 7 : 14;
    return roundMoney(
      (lease.rentAmount / periodDays) *
        inclusiveDaysBetween(activeStart, activeEnd),
    );
  }

  let expected = 0;
  const cursor = new Date(activeStart);
  const endDate = new Date(activeEnd);

  while (cursor <= endDate) {
    const monthStart = Date.UTC(
      cursor.getUTCFullYear(),
      cursor.getUTCMonth(),
      1,
    );
    const daysInMonth = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0),
    ).getUTCDate();
    const monthEnd = monthStart + (daysInMonth - 1) * MS_PER_DAY;
    const segmentStart = Math.max(activeStart, monthStart);
    const segmentEnd = Math.min(activeEnd, monthEnd);
    expected +=
      (lease.rentAmount / daysInMonth) *
      inclusiveDaysBetween(segmentStart, segmentEnd);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
  }

  return roundMoney(expected);
}

/**
 * Build one derived rent comparison per lease for the selected tax year.
 * Payments Received sums payment events linked to the lease with a receipt
 * date in the year; difference is `received - expected`, rounded to cents.
 */
export function compareLeaseRent(
  leases: Lease[],
  events: RentEvent[],
  year: number,
): LeaseRentComparison[] {
  const yearPrefix = `${year}-`;

  return leases.map((lease) => {
    const expectedRent = calculateExpectedRent(lease, year);
    const paymentsReceived = roundMoney(
      events
        .filter(
          (event) =>
            event.type === "payment" &&
            event.leaseId === lease.id &&
            event.date.startsWith(yearPrefix),
        )
        .reduce((total, event) => total + event.amount, 0),
    );
    const difference = roundMoney(paymentsReceived - expectedRent);

    return {
      leaseId: lease.id,
      year,
      expectedRent,
      paymentsReceived,
      difference,
      status:
        difference < 0
          ? "shortfall"
          : difference > 0
            ? "prepaid"
            : "paid-in-full",
    };
  });
}
