"use server";

import { and, eq, isNotNull } from "drizzle-orm";

import { db, withTransaction } from "@/db/index";
import {
  leases,
  owners,
  ownershipPeriods,
  properties,
  units,
} from "@/db/schema";
import { type ActionFailure, runAction } from "@/lib/action-utils";
import {
  appDataCacheTags,
  propertyRentSetupMutationCacheTags,
} from "@/lib/cache-tags";
import {
  isEmpty,
  type SetupForm,
  setupFormSchema,
  toPropertyValues,
  toSetupDraft,
  toSetupRows,
  validatePropertyStep,
  validateSetup,
} from "@/lib/property-setup";
import { todayIso } from "@/lib/property-workspace";

type SavedSetup = { ok: true; propertyId: string };
/** New lease id for each rented unit, keyed by the unit's form `id`. */
type CompletedSetup = SavedSetup & { leaseIdByUnit: Record<string, string> };

const SETUP_CLOSED_MESSAGE =
  "This property’s setup is already finished. Make changes from the property page.";

const setupCacheTags = ({ propertyId }: SavedSetup) => [
  ...propertyRentSetupMutationCacheTags(propertyId),
  appDataCacheTags.propertyNavigation,
];

/**
 * "Save and finish later": writes the property row and keeps the rest of the
 * form as its setup draft. `propertyId` is null on the first save.
 */
export async function savePropertySetupDraft(
  propertyId: string | null,
  input: SetupForm,
): Promise<SavedSetup | ActionFailure> {
  return runAction<SavedSetup>(
    "Property setup draft mutation",
    async () => {
      const parsed = setupFormSchema.safeParse(input);

      if (
        !parsed.success ||
        !isEmpty(validatePropertyStep(parsed.data, todayIso()))
      ) {
        return { ok: false, error: "Enter valid property details first." };
      }

      const values = {
        ...toPropertyValues(parsed.data),
        setupDraft: toSetupDraft(parsed.data),
      };

      if (propertyId === null) {
        const [created] = await db
          .insert(properties)
          .values(values)
          .returning({ id: properties.id });
        return { ok: true, propertyId: created.id };
      }

      const updated = await db
        .update(properties)
        .set(values)
        .where(openSetup(propertyId))
        .returning({ id: properties.id });

      return updated.length > 0
        ? { ok: true, propertyId }
        : { ok: false, error: SETUP_CLOSED_MESSAGE };
    },
    { invalidate: setupCacheTags },
  );
}

/**
 * Validates the whole form, then writes the property, owners with shares from
 * the acquisition date, units, and leases in one transaction and clears the draft.
 */
export async function completePropertySetup(
  propertyId: string | null,
  input: SetupForm,
): Promise<CompletedSetup | ActionFailure> {
  return runAction<CompletedSetup>(
    "Property setup completion mutation",
    async () => {
      const parsed = setupFormSchema.safeParse(input);

      if (!parsed.success || !isEmpty(validateSetup(parsed.data, todayIso()))) {
        return { ok: false, error: "Some setup answers need attention." };
      }

      const id = propertyId ?? crypto.randomUUID();
      const property = { ...toPropertyValues(parsed.data), setupDraft: null };
      const rows = toSetupRows(parsed.data, id);

      return withTransaction<CompletedSetup | ActionFailure>(async (tx) => {
        if (propertyId === null) {
          await tx.insert(properties).values({ id, ...property });
        } else {
          // Only the first completion can clear an open draft. The update's row
          // lock is held until all related records commit together.
          const completed = await tx
            .update(properties)
            .set(property)
            .where(openSetup(propertyId))
            .returning({ id: properties.id });
          if (completed.length === 0) {
            return { ok: false, error: SETUP_CLOSED_MESSAGE };
          }
        }

        await tx.insert(owners).values(rows.ownerRows);
        await tx.insert(ownershipPeriods).values(rows.periodRows);
        await tx.insert(units).values(rows.unitRows);
        if (rows.leaseRows.length > 0) {
          await tx.insert(leases).values(rows.leaseRows);
        }

        return { ok: true, propertyId: id, leaseIdByUnit: rows.leaseIdByUnit };
      });
    },
    { invalidate: setupCacheTags },
  );
}

function openSetup(propertyId: string) {
  return and(eq(properties.id, propertyId), isNotNull(properties.setupDraft));
}
