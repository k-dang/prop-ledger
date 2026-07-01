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
  NewDocument,
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
export type NewLeaseDocumentInput = Omit<
  NewDocument,
  "id" | "propertyId" | "createdAt"
> & { leaseId: string };

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
