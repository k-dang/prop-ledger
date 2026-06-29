import type { LedgerEntry } from "@/db/schema";

type ManualIncomeEntry = Pick<LedgerEntry, "amount" | "type">;

export type ManualIncomeBreakdown = {
  taxableManualIncome: number;
};

export function summarizeManualIncomeForTax(
  entries: ManualIncomeEntry[],
): ManualIncomeBreakdown {
  let taxableManualIncome = 0;

  for (const entry of entries) {
    if (entry.type !== "income") {
      continue;
    }

    taxableManualIncome += entry.amount;
  }

  return {
    taxableManualIncome: roundMoney(taxableManualIncome),
  };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
