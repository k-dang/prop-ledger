import type {
  OwnershipPeriod,
  PropertyOwner,
  RentalProperty,
  RentalUnit,
} from "@/lib/property-workspace";

export type PropertyFlagState = Pick<
  RentalProperty,
  "hasPersonalUse" | "hasShortTermRental"
>;

export type NewPropertyInput = Omit<
  RentalProperty,
  "id" | "units" | "owners" | "ownershipPeriods"
>;

export type NewUnitInput = Omit<RentalUnit, "id">;

export type NewOwnerInput = Omit<PropertyOwner, "id">;

export type NewOwnershipPeriodInput = Omit<OwnershipPeriod, "id">;
