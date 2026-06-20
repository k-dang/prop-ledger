"use server";

import { db } from "@/db/index";
import { getYearEndPackageSource } from "@/db/queries";
import { accountantNotes, yearEndPackages } from "@/db/schema";
import { runAction } from "./action-utils";
import {
  buildYearEndPackageSnapshot,
  type PackageScope,
} from "./year-end-package";

export async function addAccountantNote(
  propertyId: string,
  taxYear: number,
  formData: FormData,
): Promise<void> {
  await runAction("Accountant note creation", async () => {
    const note = String(formData.get("note") ?? "").trim();
    if (note.length === 0)
      return { ok: false, error: "Enter a note before saving." };
    await db.insert(accountantNotes).values({ propertyId, taxYear, note });
    return { ok: true };
  });
}

export async function generateYearEndPackage(
  propertyId: string,
  taxYear: number,
  ownerId: string | null,
): Promise<void> {
  await runAction("Year-end package generation", async () => {
    const source = await getYearEndPackageSource(propertyId);
    if (source === undefined)
      return { ok: false, error: "Property not found." };
    const scope: PackageScope =
      ownerId === null ? { type: "property" } : { type: "owner", ownerId };
    if (
      scope.type === "owner" &&
      !source.owners.some((owner) => owner.id === scope.ownerId)
    )
      return { ok: false, error: "Owner not found for this property." };
    const snapshot = buildYearEndPackageSnapshot({
      source,
      taxYear,
      scope,
      generatedAt: new Date().toISOString(),
    });
    await db
      .insert(yearEndPackages)
      .values({ propertyId, taxYear, scope: scope.type, ownerId, snapshot });
    return { ok: true };
  });
}
