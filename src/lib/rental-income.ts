import type { LedgerEntry, RentalIncomeCategory, RentEvent } from "@/db/schema";

type ManualIncomeEntry = Pick<
  LedgerEntry,
  "amount" | "date" | "incomeCategory" | "type"
>;

export type ManualIncomeBreakdown = {
  taxableManualIncome: number;
  excludedRentIncome: number;
};

export function summarizeManualIncomeForTax(
  entries: ManualIncomeEntry[],
  rentEvents: Pick<RentEvent, "date" | "periodEnd" | "periodStart" | "type">[],
  taxYear: number,
): ManualIncomeBreakdown {
  const chargedRentMonths = getChargedRentMonths(rentEvents, taxYear);
  let taxableManualIncome = 0;
  let excludedRentIncome = 0;

  for (const entry of entries) {
    if (entry.type !== "income") {
      continue;
    }

    if (
      isRentIncome(entry.incomeCategory) &&
      chargedRentMonths.has(monthKey(entry.date))
    ) {
      excludedRentIncome += entry.amount;
    } else {
      taxableManualIncome += entry.amount;
    }
  }

  return {
    taxableManualIncome: roundMoney(taxableManualIncome),
    excludedRentIncome: roundMoney(excludedRentIncome),
  };
}

function isRentIncome(category: RentalIncomeCategory | null) {
  return category === "rent";
}

function getChargedRentMonths(
  events: Pick<RentEvent, "date" | "periodEnd" | "periodStart" | "type">[],
  taxYear: number,
) {
  const months = new Set<string>();

  for (const event of events) {
    if (event.type !== "charge") {
      continue;
    }

    for (const month of chargedMonthsForEvent(event, taxYear)) {
      months.add(month);
    }
  }

  return months;
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

function chargedMonthsForEvent(
  event: Pick<RentEvent, "date" | "periodEnd" | "periodStart">,
  taxYear: number,
) {
  const start = event.periodStart ?? event.date;
  const end = event.periodEnd ?? event.date;
  const taxStart = `${taxYear}-01-01`;
  const taxEnd = `${taxYear}-12-31`;

  if (end < taxStart || start > taxEnd) {
    return [];
  }

  const boundedStart = start < taxStart ? taxStart : start;
  const boundedEnd = end > taxEnd ? taxEnd : end;
  const months: string[] = [];

  for (
    let month = monthKey(boundedStart);
    month <= monthKey(boundedEnd);
    month = nextMonth(month)
  ) {
    months.push(month);
  }

  return months;
}

function nextMonth(month: string) {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  const nextMonthNumber = monthNumber === 12 ? 1 : monthNumber + 1;
  const nextYear = monthNumber === 12 ? year + 1 : year;

  return `${nextYear}-${String(nextMonthNumber).padStart(2, "0")}`;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
