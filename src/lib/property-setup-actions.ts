"use server";

import { and, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db/index";
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
 * the acquisition date, units, and leases in one batch and clears the draft.
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

      if (propertyId !== null) {
        const open = await db.query.properties.findFirst({
          where: openSetup(propertyId),
          columns: { id: true },
        });

        if (open === undefined) {
          return { ok: false, error: SETUP_CLOSED_MESSAGE };
        }
      }

      const id = propertyId ?? crypto.randomUUID();
      const property = { ...toPropertyValues(parsed.data), setupDraft: null };
      const rows = toSetupRows(parsed.data, id);

      await db.batch([
        propertyId === null
          ? db.insert(properties).values({ id, ...property })
          : claimOpenSetup(propertyId),
        ...(propertyId === null
          ? []
          : [db.update(properties).set(property).where(eq(properties.id, id))]),
        db.insert(owners).values(rows.ownerRows),
        db.insert(ownershipPeriods).values(rows.periodRows),
        db.insert(units).values(rows.unitRows),
        ...(rows.leaseRows.length > 0
          ? [db.insert(leases).values(rows.leaseRows)]
          : []),
      ]);

      return { ok: true, propertyId: id, leaseIdByUnit: rows.leaseIdByUnit };
    },
    { invalidate: setupCacheTags },
  );
}

function openSetup(propertyId: string) {
  return and(eq(properties.id, propertyId), isNotNull(properties.setupDraft));
}

/**
 * Batch guard against finishing the same setup twice (two tabs or devices).
 * Locks the property row while its setup is open, then divides by the match
 * count. If another finish committed first, nothing matches and the division
 * by zero rolls back the whole batch, so records are never written twice.
 */
function claimOpenSetup(propertyId: string) {
  const open = db
    .select({ id: properties.id })
    .from(properties)
    .where(openSetup(propertyId))
    .for("update")
    .as("open_setup");

  return db.select({ claimed: sql`1 / count(*)` }).from(open);
}
