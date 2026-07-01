"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

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
  yearEndPackages,
} from "@/db/schema";
import { type ActionResult, runAction } from "@/lib/action-utils";
import {
  allAppDataCacheTags,
  portfolioMutationCacheTags,
  propertyRentSetupMutationCacheTags,
  propertySetupMutationCacheTags,
  rentLedgerMutationCacheTags,
  transactionMutationCacheTags,
} from "@/lib/cache-tags";
import {
  canAddOwnershipPeriod,
  formatDisplayDate,
  formatPercent,
  type NewOwnerWithOwnershipInput,
  type NewPropertyInput,
  type NewUnitInput,
  type OwnershipValidationIssue,
} from "@/lib/property-workspace";
import type {
  NewLeaseDocumentInput,
  NewLeaseInput,
  NewRentEventInput,
} from "@/lib/rent-ledger";

// Server-side contract for a new property. A server action is a public
// endpoint, so the client form's schema cannot be trusted: re-validate here and
// require `acquisitionDate` to be a real ISO date, since the dashboard derives
// active-year and tax-year logic from it by string comparison.
const newPropertySchema = z.object({
  name: z.string().trim().min(1),
  line1: z.string().trim().min(1),
  line2: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null))
    .nullish(),
  municipality: z.string().trim().min(1),
  province: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  acquisitionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => !Number.isNaN(new Date(value).getTime())),
});

type LeaseMutationSuccess = { ok: true; propertyId: string };
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(new Date(value).getTime()));

const rentPaymentInputSchema = z
  .object({
    type: z.literal("payment"),
    leaseId: z.string().trim().min(1),
    date: isoDateSchema,
    amount: z.number().positive(),
    memo: z
      .string()
      .trim()
      .transform((value) => (value.length > 0 ? value : null))
      .nullish(),
  })
  .transform(
    (data): NewRentEventInput => ({
      type: data.type,
      leaseId: data.leaseId,
      date: data.date,
      amount: data.amount,
      memo: data.memo ?? null,
    }),
  );

export async function createProperty(
  input: NewPropertyInput,
): Promise<ActionResult> {
  return runAction(
    "Property creation mutation",
    async () => {
      const parsed = newPropertySchema.safeParse(input);

      if (!parsed.success) {
        return {
          ok: false,
          error: "Enter valid property details before saving.",
        };
      }

      await db.insert(properties).values(parsed.data);

      return { ok: true };
    },
    { invalidate: portfolioMutationCacheTags() },
  );
}

export async function addUnit(
  propertyId: string,
  input: NewUnitInput,
): Promise<ActionResult> {
  return runAction(
    "Unit mutation",
    async () => {
      await db.insert(units).values({ propertyId, ...input });

      return { ok: true };
    },
    { invalidate: propertyRentSetupMutationCacheTags(propertyId) },
  );
}

export async function deleteUnit(
  propertyId: string,
  unitId: string,
): Promise<ActionResult> {
  return runAction(
    "Unit delete mutation",
    async () => {
      const unit = await db.query.units.findFirst({
        where: and(eq(units.id, unitId), eq(units.propertyId, propertyId)),
        columns: { id: true },
      });

      if (unit === undefined) {
        return { ok: false, error: "That unit no longer exists." };
      }

      const lease = await db.query.leases.findFirst({
        where: eq(leases.unitId, unitId),
        columns: { id: true },
      });

      if (lease !== undefined) {
        return {
          ok: false,
          error: "Units with leases cannot be deleted from setup.",
        };
      }

      await db
        .delete(units)
        .where(and(eq(units.id, unitId), eq(units.propertyId, propertyId)));

      return { ok: true };
    },
    { invalidate: propertyRentSetupMutationCacheTags(propertyId) },
  );
}

export async function addOwnerWithOwnership(
  propertyId: string,
  input: NewOwnerWithOwnershipInput,
): Promise<ActionResult> {
  return runAction(
    "Owner mutation",
    async () => {
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
      };

      await db.batch([
        db.insert(owners).values(owner),
        db.insert(ownershipPeriods).values(nextPeriod),
      ]);

      return { ok: true };
    },
    { invalidate: propertySetupMutationCacheTags(propertyId) },
  );
}

export async function deleteOwner(
  propertyId: string,
  ownerId: string,
): Promise<ActionResult> {
  return runAction(
    "Owner delete mutation",
    async () => {
      const owner = await db.query.owners.findFirst({
        where: and(eq(owners.id, ownerId), eq(owners.propertyId, propertyId)),
        columns: { id: true },
      });

      if (owner === undefined) {
        return { ok: false, error: "That owner no longer exists." };
      }

      const yearEndPackage = await db.query.yearEndPackages.findFirst({
        where: and(
          eq(yearEndPackages.propertyId, propertyId),
          eq(yearEndPackages.ownerId, ownerId),
        ),
        columns: { id: true },
      });

      if (yearEndPackage !== undefined) {
        return {
          ok: false,
          error: "Owners with year-end packages cannot be deleted from setup.",
        };
      }

      await db
        .delete(owners)
        .where(and(eq(owners.id, ownerId), eq(owners.propertyId, propertyId)));

      return { ok: true };
    },
    { invalidate: propertySetupMutationCacheTags(propertyId) },
  );
}

export async function createLease(input: NewLeaseInput): Promise<ActionResult> {
  return runAction<LeaseMutationSuccess>(
    "Lease mutation",
    async () => {
      const unit = await db.query.units.findFirst({
        where: eq(units.id, input.unitId),
        columns: { propertyId: true },
      });

      if (unit === undefined) {
        return { ok: false, error: "Select a unit before saving the lease." };
      }

      await db.insert(leases).values(input);

      return { ok: true, propertyId: unit.propertyId };
    },
    { invalidate: ({ propertyId }) => rentLedgerMutationCacheTags(propertyId) },
  );
}

export async function deleteLease(leaseId: string): Promise<ActionResult> {
  return runAction<LeaseMutationSuccess>(
    "Lease deletion mutation",
    async () => {
      const lease = await db.query.leases.findFirst({
        where: eq(leases.id, leaseId),
        columns: { id: true },
        with: { unit: { columns: { propertyId: true } } },
      });

      if (lease === undefined) {
        return { ok: false, error: "That lease no longer exists." };
      }

      const event = await db.query.rentEvents.findFirst({
        where: and(
          eq(rentEvents.leaseId, leaseId),
          eq(rentEvents.type, "payment"),
        ),
        columns: { id: true },
      });

      if (event !== undefined) {
        return {
          ok: false,
          error:
            "Leases with recorded rent payments cannot be deleted. Delete the related payments first.",
        };
      }

      await db.batch([
        db
          .delete(documentLinks)
          .where(
            and(
              eq(documentLinks.targetType, "lease"),
              eq(documentLinks.targetId, leaseId),
            ),
          ),
        db.delete(leases).where(eq(leases.id, leaseId)),
      ]);

      return { ok: true, propertyId: lease.unit.propertyId };
    },
    { invalidate: ({ propertyId }) => rentLedgerMutationCacheTags(propertyId) },
  );
}

export async function recordRentEvent(
  propertyId: string,
  input: NewRentEventInput,
): Promise<ActionResult> {
  return runAction(
    "Rent event mutation",
    async () => {
      const parsed = rentPaymentInputSchema.safeParse(input);

      if (!parsed.success) {
        return {
          ok: false,
          error: "Enter a valid rent payment before saving.",
        };
      }

      const lease = await db.query.leases.findFirst({
        where: eq(leases.id, parsed.data.leaseId),
        columns: { id: true },
        with: { unit: { columns: { propertyId: true } } },
      });

      if (lease === undefined || lease.unit.propertyId !== propertyId) {
        return {
          ok: false,
          error: "Select a lease for this rent payment.",
        };
      }

      await db.insert(rentEvents).values({ propertyId, ...parsed.data });

      return { ok: true };
    },
    { invalidate: rentLedgerMutationCacheTags(propertyId) },
  );
}

export async function deleteRentEvent(
  propertyId: string,
  rentEventId: string,
): Promise<ActionResult> {
  return runAction(
    "Rent event deletion mutation",
    async () => {
      const event = await db.query.rentEvents.findFirst({
        where: and(
          eq(rentEvents.id, rentEventId),
          eq(rentEvents.propertyId, propertyId),
        ),
        columns: { id: true },
      });

      if (event === undefined) {
        return { ok: false, error: "That rent ledger entry no longer exists." };
      }

      await db.batch([
        db
          .delete(documentLinks)
          .where(
            and(
              eq(documentLinks.targetType, "rent_event"),
              eq(documentLinks.targetId, rentEventId),
            ),
          ),
        db
          .delete(rentEvents)
          .where(
            and(
              eq(rentEvents.id, rentEventId),
              eq(rentEvents.propertyId, propertyId),
            ),
          ),
      ]);

      return { ok: true };
    },
    { invalidate: rentLedgerMutationCacheTags(propertyId) },
  );
}

export async function addLeaseDocument(
  propertyId: string,
  input: NewLeaseDocumentInput,
): Promise<ActionResult> {
  return runAction(
    "Lease document mutation",
    async () => {
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
    },
    { invalidate: transactionMutationCacheTags(propertyId) },
  );
}

export async function resetPortfolio(
  confirmation: string,
): Promise<ActionResult> {
  return runAction(
    "Portfolio reset mutation",
    async () => {
      // Re-check the typed confirmation on the server: the client gate is just a
      // UX affordance and a direct caller would otherwise wipe everything.
      if (confirmation !== "RESET") {
        return { ok: false, error: "Type RESET to confirm." };
      }

      // Delete year-end packages before properties. Deleting a property cascades
      // to both its owners and its packages, but `yearEndPackages.ownerId` has an
      // onDelete: "restrict" edge to owners, so an owner-scoped package would
      // abort the whole cascade. Clearing packages first removes that edge.
      // db.batch runs the statements in order inside one transaction (neon-http
      // has no interactive transactions, so we cannot use db.transaction here).
      await db.batch([db.delete(yearEndPackages), db.delete(properties)]);
      return { ok: true };
    },
    { invalidate: allAppDataCacheTags },
  );
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
