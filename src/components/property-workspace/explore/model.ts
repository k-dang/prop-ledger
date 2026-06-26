import type { PropertyReadiness } from "@/lib/property-workspace";

/**
 * A serializable view model for the prototype design directions. The server page
 * derives it once from the `RentalProperty` aggregate and hands the same shape to
 * every variant, so the directions differ only in presentation — never in data.
 */
export type ExploreModel = {
  property: {
    id: string;
    name: string;
    line1: string;
    municipality: string;
    province: string;
    postalCode: string;
    acquisitionDate: string;
  };
  readiness: PropertyReadiness;
  counts: {
    units: number;
    owners: number;
    ownershipPeriods: number;
    documents: number;
    ledgerEntries: number;
    mortgagePayments: number;
  };
  units: { id: string; label: string; unitType: string }[];
  ownership: {
    id: string;
    ownerName: string;
    ownerEmail: string | null;
    percentageLabel: string;
    dateRange: string;
  }[];
};

export type SetupTaskStatus =
  ExploreModel["readiness"]["tasks"][number]["status"];
