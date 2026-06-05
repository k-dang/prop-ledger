/**
 * Rent-ledger domain logic.
 *
 * Rent is tracked on an accrual basis: `charge` events record earned rent
 * independently of the `payment` events that record cash received, so arrears
 * stay visible and gross rent is never reduced to "what was deposited". This
 * module owns the pure logic — schedule generation, arrears, and the year-scoped
 * summary; persistence shapes come from the database schema, and `src/db/queries.ts`
 * assembles the `RentLedger` aggregate this module reports on.
 */
import type {
  Document,
  DocumentLink,
  Lease,
  NewDocument,
  NewLease,
  NewRentEvent,
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
 * Form inputs for the rent-ledger server actions: insert shapes minus the
 * columns the database fills in (`id`) and the `propertyId` the action supplies
 * from route context.
 */
export type NewLeaseInput = Omit<NewLease, "id">;
export type NewRentEventInput = Omit<NewRentEvent, "id" | "propertyId">;
export type NewLeaseDocumentInput = Omit<
  NewDocument,
  "id" | "propertyId" | "createdAt"
> & { leaseId: string };

/** A document loaded with the links that attach it to other records. */
export type DocumentWithLinks = Document & { links: DocumentLink[] };

/**
 * The rent ledger for one property, loaded as an aggregate: the property row,
 * its units, every lease under those units, the full rent-event ledger, and the
 * documents (with links) uploaded against the property.
 */
export type RentLedger = {
  property: Property;
  units: Unit[];
  leases: Lease[];
  rentEvents: RentEvent[];
  documents: DocumentWithLinks[];
};

/** An accrual rent charge produced from a lease's terms, before it is saved. */
export type RentChargeDraft = {
  periodStart: string;
  periodEnd: string;
  date: string;
  amount: number;
};

/**
 * Generate accrual rent charges from a lease's terms, from its start through
 * `throughDate` (or the lease end, whichever is first). Monthly leases bill one
 * charge per calendar month, prorating the first and last months by day count;
 * weekly and biweekly leases bill one charge per interval, prorating only a final
 * interval cut short by the boundary. Charges are accruals, not payments.
 */
export function generateRentCharges(
  lease: Pick<Lease, "rentAmount" | "rentFrequency" | "startDate" | "endDate">,
  throughDate: string,
): RentChargeDraft[] {
  const end =
    lease.endDate !== null && lease.endDate < throughDate
      ? lease.endDate
      : throughDate;

  if (end < lease.startDate) {
    return [];
  }

  if (lease.rentFrequency === "monthly") {
    return generateMonthlyCharges(lease.startDate, end, lease.rentAmount);
  }

  const step = lease.rentFrequency === "weekly" ? 7 : 14;
  return generateIntervalCharges(lease.startDate, end, lease.rentAmount, step);
}

function generateMonthlyCharges(
  start: string,
  end: string,
  rentAmount: number,
): RentChargeDraft[] {
  const charges: RentChargeDraft[] = [];

  for (
    let month = firstOfMonth(start);
    month <= end;
    month = firstOfNextMonth(month)
  ) {
    const monthStart = month;
    const monthEnd = lastOfMonth(month);
    const periodStart = monthStart < start ? start : monthStart;
    const periodEnd = monthEnd > end ? end : monthEnd;
    const isFullMonth = periodStart === monthStart && periodEnd === monthEnd;
    const amount = isFullMonth
      ? rentAmount
      : roundMoney(
          (rentAmount * dayCount(periodStart, periodEnd)) /
            dayCount(monthStart, monthEnd),
        );

    charges.push({ periodStart, periodEnd, date: periodStart, amount });
  }

  return charges;
}

function generateIntervalCharges(
  start: string,
  end: string,
  rentAmount: number,
  step: number,
): RentChargeDraft[] {
  const charges: RentChargeDraft[] = [];

  for (
    let periodStart = start;
    periodStart <= end;
    periodStart = addIsoDays(periodStart, step)
  ) {
    const fullEnd = addIsoDays(periodStart, step - 1);
    const periodEnd = fullEnd > end ? end : fullEnd;
    const amount =
      periodEnd === fullEnd
        ? rentAmount
        : roundMoney((rentAmount * dayCount(periodStart, periodEnd)) / step);

    charges.push({ periodStart, periodEnd, date: periodStart, amount });
  }

  return charges;
}

/**
 * The running balance for one lease: rent charged, less what has been paid,
 * credited, or written off. A positive balance is arrears owed by the tenant.
 */
export type LeaseBalance = {
  leaseId: string;
  charged: number;
  paid: number;
  credited: number;
  writtenOff: number;
  balance: number;
};

/** Net each lease's rent events into a running balance, keyed by lease id. */
export function computeLeaseBalances(
  events: RentEvent[],
): Map<string, LeaseBalance> {
  const balances = new Map<string, LeaseBalance>();

  for (const event of events) {
    if (event.leaseId === null) {
      continue;
    }

    const balance =
      balances.get(event.leaseId) ?? emptyLeaseBalance(event.leaseId);

    if (event.type === "charge") {
      balance.charged += event.amount;
    } else if (event.type === "payment") {
      balance.paid += event.amount;
    } else if (event.type === "credit") {
      balance.credited += event.amount;
    } else if (event.type === "writeoff") {
      balance.writtenOff += event.amount;
    }

    balances.set(event.leaseId, balance);
  }

  for (const balance of balances.values()) {
    balance.balance = roundMoney(
      balance.charged - balance.paid - balance.credited - balance.writtenOff,
    );
  }

  return balances;
}

/** One row of the arrears view: a lease, its tenant and unit, and its balance. */
export type ArrearsRow = LeaseBalance & {
  tenantName: string;
  unitId: string;
};

/**
 * Arrears by tenant and unit: every lease with its current balance, sorted with
 * the largest outstanding balance first so unpaid rent surfaces at the top.
 */
export function summarizeArrears(
  leases: Lease[],
  events: RentEvent[],
): ArrearsRow[] {
  const balances = computeLeaseBalances(events);

  return leases
    .map((lease) => {
      const balance = balances.get(lease.id) ?? emptyLeaseBalance(lease.id);

      return {
        ...balance,
        tenantName: lease.tenantName,
        unitId: lease.unitId,
      };
    })
    .toSorted((a, b) => b.balance - a.balance);
}

/**
 * A rent ledger summary scoped to one tax year. Income figures count only events
 * dated within the year; `arrearsAtYearEnd` is the cumulative balance of all
 * events on or before December 31 of that year, since arrears carry across years.
 */
export type RentLedgerSummary = {
  year: number;
  grossRent: number;
  otherIncome: number;
  paymentsReceived: number;
  credits: number;
  writeoffs: number;
  grossRentalIncome: number;
  arrearsAtYearEnd: number;
};

/** Build the year-scoped rent ledger summary for a property's rent events. */
export function summarizeRentLedger(
  events: RentEvent[],
  year: number,
): RentLedgerSummary {
  const yearPrefix = `${year}-`;
  const yearEnd = `${year}-12-31`;
  const inYear = events.filter((event) => event.date.startsWith(yearPrefix));

  const grossRent = sumByType(inYear, "charge");
  const otherIncome = sumByType(inYear, "other_income");
  const arrears = computeLeaseBalances(
    events.filter((event) => event.date <= yearEnd),
  );
  const arrearsAtYearEnd = roundMoney(
    [...arrears.values()].reduce(
      (total, balance) => total + balance.balance,
      0,
    ),
  );

  return {
    year,
    grossRent,
    otherIncome,
    paymentsReceived: sumByType(inYear, "payment"),
    credits: sumByType(inYear, "credit"),
    writeoffs: sumByType(inYear, "writeoff"),
    grossRentalIncome: roundMoney(grossRent + otherIncome),
    arrearsAtYearEnd,
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
  return moneyFormatter.format(value);
}

function sumByType(events: RentEvent[], type: RentEvent["type"]): number {
  return roundMoney(
    events
      .filter((event) => event.type === type)
      .reduce((total, event) => total + event.amount, 0),
  );
}

function emptyLeaseBalance(leaseId: string): LeaseBalance {
  return {
    leaseId,
    charged: 0,
    paid: 0,
    credited: 0,
    writtenOff: 0,
    balance: 0,
  };
}

function firstOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

function lastOfMonth(date: string): string {
  const [year, month] = date.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return `${date.slice(0, 7)}-${String(lastDay).padStart(2, "0")}`;
}

function firstOfNextMonth(date: string): string {
  const [year, month] = date.split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

function addIsoDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);

  return parsed.toISOString().slice(0, 10);
}

/** Number of calendar days from `start` to `end`, inclusive of both endpoints. */
function dayCount(start: string, end: string): number {
  const ms =
    Date.parse(`${end}T00:00:00.000Z`) - Date.parse(`${start}T00:00:00.000Z`);

  return Math.round(ms / 86_400_000) + 1;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
