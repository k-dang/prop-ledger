"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";

import { db } from "@/db/index";
import { owners, ownershipPeriods, properties, units } from "@/db/schema";
import {
  canAddOwnershipPeriod,
  formatDisplayDate,
  formatPercent,
  type NewOwnerInput,
  type NewOwnershipPeriodInput,
  type NewPropertyInput,
  type NewUnitInput,
  type OwnershipValidationIssue,
} from "@/lib/property-workspace";

export type ActionResult = { ok: boolean; error?: string };

const SAVE_FAILED_MESSAGE =
  "Something went wrong saving your changes. Please try again.";

/**
 * Runs a mutation that reports its own outcome. Infrastructure failures are
 * caught and returned as data — never thrown across the action boundary — and the
 * current route re-renders after any successful mutation.
 */
async function runAction(
  mutate: () => Promise<ActionResult>,
): Promise<ActionResult> {
  try {
    const result = await mutate();

    if (result.ok) {
      refresh();
    }

    return result;
  } catch (error) {
    // The cause never reaches the client, so log it here or it is lost — a
    // constraint violation and a dropped connection look identical otherwise.
    console.error("Property workspace mutation failed", error);
    return { ok: false, error: SAVE_FAILED_MESSAGE };
  }
}

export async function createProperty(
  input: NewPropertyInput,
): Promise<ActionResult> {
  return runAction(async () => {
    // `input` already matches the insert shape, so it writes straight through.
    await db.insert(properties).values(input);
    return { ok: true };
  });
}

export async function addUnit(
  propertyId: string,
  input: NewUnitInput,
): Promise<ActionResult> {
  return runAction(async () => {
    await db.insert(units).values({ propertyId, ...input });
    return { ok: true };
  });
}

export async function addOwner(
  propertyId: string,
  input: NewOwnerInput,
): Promise<ActionResult> {
  return runAction(async () => {
    await db.insert(owners).values({ propertyId, ...input });
    return { ok: true };
  });
}

export async function addOwnershipPeriod(
  propertyId: string,
  input: NewOwnershipPeriodInput,
): Promise<ActionResult> {
  return runAction(async () => {
    const existing = await db
      .select()
      .from(ownershipPeriods)
      .where(eq(ownershipPeriods.propertyId, propertyId));

    const nextPeriod = {
      id: crypto.randomUUID(),
      propertyId,
      ownerId: input.ownerId,
      percentage: input.percentage,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo ?? null,
    };

    const validation = canAddOwnershipPeriod(existing, nextPeriod);

    if (!validation.ok) {
      return { ok: false, error: formatOwnershipIssue(validation.issues[0]) };
    }

    await db.insert(ownershipPeriods).values(nextPeriod);
    return { ok: true };
  });
}

export async function resetPortfolio(): Promise<ActionResult> {
  return runAction(async () => {
    // Cascading foreign keys clear units, owners, ownership periods, etc.
    await db.delete(properties);
    return { ok: true };
  });
}

function formatOwnershipIssue(issue: OwnershipValidationIssue | undefined) {
  if (issue === undefined) {
    return "Review ownership shares.";
  }

  if (issue.code === "OVER_ALLOCATED" && issue.date !== undefined) {
    return `${issue.message} ${formatPercent(issue.totalPercentage ?? 0)}% is active on ${formatDisplayDate(issue.date)}.`;
  }

  return issue.message;
}
