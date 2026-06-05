"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";

import { db } from "@/db/index";
import {
  documentLinks,
  documents,
  leases,
  owners,
  ownershipPeriods,
  properties,
  rentEvents,
  units,
} from "@/db/schema";
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
import {
  generateRentCharges,
  type NewLeaseDocumentInput,
  type NewLeaseInput,
  type NewRentEventInput,
} from "@/lib/rent-ledger";

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

export async function createLease(input: NewLeaseInput): Promise<ActionResult> {
  return runAction(async () => {
    await db.insert(leases).values(input);
    return { ok: true };
  });
}

/**
 * Materialize a lease's accrual schedule into `charge` rent events up to
 * `throughDate`. Charges are keyed by their period start, so re-running this
 * after the lease has already been charged only inserts the periods that are
 * still missing — generating twice never double-bills a month.
 */
export async function generateLeaseCharges(
  leaseId: string,
  throughDate: string,
): Promise<ActionResult> {
  return runAction(async () => {
    // The lease's unit determines its property, so the charges inherit a
    // propertyId that cannot disagree with the lease — no separate arg to mismatch.
    const lease = await db.query.leases.findFirst({
      where: eq(leases.id, leaseId),
      with: { unit: { columns: { propertyId: true } } },
    });

    if (lease === undefined) {
      return { ok: false, error: "That lease no longer exists." };
    }

    const propertyId = lease.unit.propertyId;

    const existing = await db
      .select({ periodStart: rentEvents.periodStart })
      .from(rentEvents)
      .where(
        and(eq(rentEvents.leaseId, leaseId), eq(rentEvents.type, "charge")),
      );
    const chargedPeriods = new Set(
      existing.map((row) => row.periodStart).filter((start) => start !== null),
    );

    const newCharges = generateRentCharges(lease, throughDate).filter(
      (charge) => !chargedPeriods.has(charge.periodStart),
    );

    if (newCharges.length === 0) {
      return { ok: true };
    }

    await db.insert(rentEvents).values(
      newCharges.map((charge) => ({
        propertyId,
        leaseId,
        type: "charge" as const,
        date: charge.date,
        amount: charge.amount,
        periodStart: charge.periodStart,
        periodEnd: charge.periodEnd,
      })),
    );
    return { ok: true };
  });
}

export async function recordRentEvent(
  propertyId: string,
  input: NewRentEventInput,
): Promise<ActionResult> {
  return runAction(async () => {
    // Only property-level other income may be lease-less. A charge, payment,
    // credit, or write-off with no lease would vanish from every balance, so
    // the rule is enforced here at the boundary rather than trusting callers.
    if (input.type !== "other_income" && input.leaseId === null) {
      return { ok: false, error: "Select a lease for this rent ledger entry." };
    }

    await db.insert(rentEvents).values({ propertyId, ...input });
    return { ok: true };
  });
}

/**
 * Record a document against a lease: store the evidence record, then link it to
 * the lease. The neon-http driver has no interactive transactions, so on the
 * rare event the link insert fails the document simply lands unlinked — which the
 * Phase 3 binder surfaces as an unlinked document rather than losing the upload.
 */
export async function addLeaseDocument(
  propertyId: string,
  input: NewLeaseDocumentInput,
): Promise<ActionResult> {
  return runAction(async () => {
    const { leaseId, ...documentInput } = input;
    const [inserted] = await db
      .insert(documents)
      .values({ propertyId, ...documentInput })
      .returning({ id: documents.id });

    if (inserted === undefined) {
      return { ok: false, error: SAVE_FAILED_MESSAGE };
    }

    await db.insert(documentLinks).values({
      documentId: inserted.id,
      targetType: "lease",
      targetId: leaseId,
    });
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
