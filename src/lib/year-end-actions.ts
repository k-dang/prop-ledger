"use server";

import { db } from "@/db/index";
import { accountantNotes } from "@/db/schema";
import { runAction } from "./action-utils";
import { yearEndMutationCacheTags } from "./cache-tags";

export async function addAccountantNote(
  propertyId: string,
  taxYear: number,
  formData: FormData,
): Promise<void> {
  await runAction(
    "Accountant note creation",
    async () => {
      const note = String(formData.get("note") ?? "").trim();
      if (note.length === 0)
        return { ok: false, error: "Enter a note before saving." };
      await db.insert(accountantNotes).values({ propertyId, taxYear, note });
      return { ok: true };
    },
    { invalidate: yearEndMutationCacheTags(propertyId, taxYear) },
  );
}
