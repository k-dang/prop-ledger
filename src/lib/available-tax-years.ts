import type { RentEvent } from "../db/schema";
import { entryYear } from "./evidence-binder";
import type { RentalProperty } from "./property-workspace";
import { isValidTaxYear } from "./tax-year";

export type DashboardPropertySource = RentalProperty & {
  rentEvents: RentEvent[];
};

/**
 * Tax years where a property has recordable data: acquisition, rent payments,
 * ledger entries, and mortgage payments. The selected year and the current
 * year are always included so pickers can show them before any data exists.
 */
export function getAvailableTaxYears(
  properties: DashboardPropertySource[],
  selectedYear: number,
  currentYear = new Date().getFullYear(),
) {
  const years = new Set<number>([selectedYear, currentYear]);

  for (const property of properties) {
    years.add(Number(property.acquisitionDate.slice(0, 4)));

    for (const event of property.rentEvents.filter(
      (candidate) => candidate.type === "payment",
    )) {
      years.add(Number(event.date.slice(0, 4)));
    }

    for (const entry of property.ledgerEntries) {
      years.add(entryYear(entry));
    }

    for (const payment of property.mortgagePayments) {
      years.add(Number(payment.date.slice(0, 4)));
    }
  }

  return [...years].filter(isValidTaxYear).toSorted((a, b) => b - a);
}
