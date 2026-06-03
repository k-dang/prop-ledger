"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import type {
  NewOwnerInput,
  NewOwnershipPeriodInput,
  NewPropertyInput,
  NewUnitInput,
} from "@/components/property-workspace/workspace-types";
import { db } from "@/db/index";
import { owners, ownershipPeriods, properties, units } from "@/db/schema";
import {
  canAddOwnershipPeriod,
  formatPercent,
  type OwnershipValidationIssue,
} from "@/lib/property-workspace";

export type ActionResult = { ok: boolean; error?: string };

export async function createProperty(
  input: NewPropertyInput,
): Promise<boolean> {
  // `input` already matches the insert shape, so it writes straight through.
  await db.insert(properties).values(input);

  // Pages are force-dynamic, so re-rendering the current route is enough to
  // reflect the write — no path cache to invalidate.
  refresh();
  return true;
}

export async function addUnit(
  propertyId: string,
  input: NewUnitInput,
): Promise<boolean> {
  await db.insert(units).values({ propertyId, ...input });

  refresh();
  return true;
}

export async function addOwner(
  propertyId: string,
  input: NewOwnerInput,
): Promise<boolean> {
  await db.insert(owners).values({ propertyId, ...input });

  refresh();
  return true;
}

export async function addOwnershipPeriod(
  propertyId: string,
  input: NewOwnershipPeriodInput,
): Promise<ActionResult> {
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

  refresh();
  return { ok: true };
}

export async function resetPortfolio(): Promise<void> {
  // Cascading foreign keys clear units, owners, ownership periods, etc.
  await db.delete(properties);
  refresh();
}

function formatOwnershipIssue(issue: OwnershipValidationIssue | undefined) {
  if (issue === undefined) {
    return "Review ownership shares.";
  }

  if (issue.code === "OVER_ALLOCATED") {
    return `${issue.message} ${formatPercent(issue.totalPercentage ?? 0)}% is active on ${issue.date}.`;
  }

  return issue.message;
}
