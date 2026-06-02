import type {
  OwnershipPeriod,
  PropertyOwner,
  RentalProperty,
  RentalUnit,
} from "@/lib/property-workspace";

export type PropertyFlagState = Pick<RentalProperty, "hasPersonalUse">;

export type NewPropertyInput = Omit<
  RentalProperty,
  "id" | "units" | "owners" | "ownershipPeriods" | "capitalAssets" | "taxYears"
>;

export type NewUnitInput = Omit<RentalUnit, "id">;

export type NewOwnerInput = Omit<PropertyOwner, "id">;

export type NewOwnershipPeriodInput = Omit<OwnershipPeriod, "id">;
