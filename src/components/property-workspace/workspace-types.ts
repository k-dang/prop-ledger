import type {
  NewOwner,
  NewOwnershipPeriod,
  NewProperty,
  NewUnit,
} from "@/db/schema";
import type { RentalProperty } from "@/lib/property-workspace";

export type PropertyFlagState = Pick<RentalProperty, "hasPersonalUse">;

// Inputs are the insert shapes minus the columns the database fills in: the
// generated `id`/`createdAt` and the `propertyId` supplied by the action.
export type NewPropertyInput = Omit<NewProperty, "id" | "createdAt">;

export type NewUnitInput = Omit<NewUnit, "id" | "propertyId">;

export type NewOwnerInput = Omit<NewOwner, "id" | "propertyId">;

export type NewOwnershipPeriodInput = Omit<
  NewOwnershipPeriod,
  "id" | "propertyId"
>;
