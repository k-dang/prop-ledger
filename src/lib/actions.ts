"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
import { type ActionResult, runAction } from "@/lib/action-utils";
import {
  canAddOwnershipPeriod,
  formatDisplayDate,
  formatPercent,
  type NewOwnerWithOwnershipInput,
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

export async function createProperty(
  input: NewPropertyInput,
): Promise<ActionResult> {
  return runAction("Property creation mutation", async () => {
    // `input` already matches the insert shape, so it writes straight through.
    await db.insert(properties).values(input);
    revalidatePath("/", "layout");

    return { ok: true };
  });
}

export async function addUnit(
  propertyId: string,
  input: NewUnitInput,
): Promise<ActionResult> {
  return runAction("Unit mutation", async () => {
    await db.insert(units).values({ propertyId, ...input });

    return { ok: true };
  });
}

export async function addOwnerWithOwnership(
  propertyId: string,
  input: NewOwnerWithOwnershipInput,
): Promise<ActionResult> {
  return runAction("Owner mutation", async () => {
    const ownerId = crypto.randomUUID();
    const existing = await db
      .select()
      .from(ownershipPeriods)
      .where(eq(ownershipPeriods.propertyId, propertyId));
    const nextPeriod = {
      id: crypto.randomUUID(),
      propertyId,
      ownerId,
      percentage: input.percentage,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo ?? null,
    };
    const validation = canAddOwnershipPeriod(existing, nextPeriod);

    if (!validation.ok) {
      return { ok: false, error: formatOwnershipIssue(validation.issues[0]) };
    }

    const owner = {
      id: ownerId,
      propertyId,
      name: input.name,
      email: input.email,
    };

    await db.batch([
      db.insert(owners).values(owner),
      db.insert(ownershipPeriods).values(nextPeriod),
    ]);

    return { ok: true };
  });
}

export async function createLease(input: NewLeaseInput): Promise<ActionResult> {
  return runAction("Lease mutation", async () => {
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
  return runAction("Rent charge generation mutation", async () => {
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
  return runAction("Rent event mutation", async () => {
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

export async function addLeaseDocument(
  propertyId: string,
  input: NewLeaseDocumentInput,
): Promise<ActionResult> {
  return runAction("Lease document mutation", async () => {
    const { leaseId, ...documentInput } = input;
    const documentId = crypto.randomUUID();

    await db.batch([
      db
        .insert(documents)
        .values({ id: documentId, propertyId, ...documentInput }),
      db.insert(documentLinks).values({
        documentId,
        targetType: "lease",
        targetId: leaseId,
      }),
    ]);
    return { ok: true };
  });
}

export async function resetPortfolio(): Promise<ActionResult> {
  return runAction("Portfolio reset mutation", async () => {
    // Cascading foreign keys clear units, owners, ownership periods, etc.
    await db.delete(properties);
    revalidatePath("/", "layout");
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
