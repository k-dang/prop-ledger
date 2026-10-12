"use client";

import { Split, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormErrorAlert } from "@/components/property-workspace/form-error-alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  saveTransactionSplits,
  setTransactionPrepaid,
} from "@/lib/allocation-actions";
import {
  isPrepaid,
  type LedgerEntryWithSplits,
  type TransactionSplitInput,
} from "@/lib/allocations";
import {
  RENTAL_INCOME_CATEGORY_OPTIONS,
  T776_CATEGORY_OPTIONS,
} from "@/lib/evidence-binder";
import { formatMoney } from "@/lib/rent-ledger";
import { toneSurface } from "@/lib/status-styles";
import { cn } from "@/lib/utils";

type SplitDraft = {
  key: string;
  category: string;
  amount: string;
  memo: string;
};

const UNCATEGORIZED = "__uncategorized";

export function TransactionAllocationControls({
  propertyId,
  entry,
}: {
  propertyId: string;
  entry: LedgerEntryWithSplits;
}) {
  const prepaid = isPrepaid(entry);

  return (
    <Accordion className="rounded-md border bg-background">
      <AccordionItem value={`allocation-${entry.id}`} className="border-b-0">
        <AccordionTrigger className="items-center px-3 py-2 hover:no-underline">
          <span className="flex flex-wrap items-center gap-2">
            <Split className="size-4" aria-hidden="true" />
            Allocate
            {entry.splits.length > 0 ? (
              <Badge variant="outline" className="rounded-md">
                {entry.splits.length} splits
              </Badge>
            ) : null}
            {prepaid ? (
              <Badge
                variant="outline"
                className={cn("rounded-md", toneSurface.info)}
              >
                prepaid
              </Badge>
            ) : null}
          </span>
        </AccordionTrigger>
        <AccordionContent className="grid gap-4 border-t p-3 pb-3">
          <PrepaidEditor propertyId={propertyId} entry={entry} />
          <SplitsEditor propertyId={propertyId} entry={entry} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function PrepaidEditor({
  propertyId,
  entry,
}: {
  propertyId: string;
  entry: LedgerEntryWithSplits;
}) {
  const [error, setError] = useState<string>();

  async function handleSave(formData: FormData) {
    const start = (formData.get("prepaidStart") as string) || null;
    const end = (formData.get("prepaidEnd") as string) || null;
    const result = await setTransactionPrepaid(
      propertyId,
      entry.id,
      start,
      end,
    );
    setError(result.ok ? undefined : result.error);
  }

  async function handleClear() {
    const result = await setTransactionPrepaid(
      propertyId,
      entry.id,
      null,
      null,
    );
    setError(result.ok ? undefined : result.error);
  }

  return (
    <form
      className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
      action={handleSave}
    >
      <Field>
        <FieldLabel htmlFor={`prepaid-start-${entry.id}`}>
          Prepaid from
        </FieldLabel>
        <DatePickerField
          id={`prepaid-start-${entry.id}`}
          name="prepaidStart"
          defaultValue={entry.prepaidStartDate ?? ""}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`prepaid-end-${entry.id}`}>Prepaid to</FieldLabel>
        <DatePickerField
          id={`prepaid-end-${entry.id}`}
          name="prepaidEnd"
          defaultValue={entry.prepaidEndDate ?? ""}
        />
      </Field>
      <Button type="submit" variant="outline" className="rounded-md">
        Save period
      </Button>
      <Button
        type="button"
        variant="outline"
        className="rounded-md"
        onClick={() => {
          void handleClear();
        }}
      >
        Clear
      </Button>
      <div className="sm:col-span-4">
        <FormErrorAlert message={error} />
      </div>
    </form>
  );
}

function SplitsEditor({
  propertyId,
  entry,
}: {
  propertyId: string;
  entry: LedgerEntryWithSplits;
}) {
  const categoryOptions =
    entry.type === "expense"
      ? T776_CATEGORY_OPTIONS
      : RENTAL_INCOME_CATEGORY_OPTIONS;
  const [drafts, setDrafts] = useState<SplitDraft[]>(() =>
    entry.splits.map((split) => ({
      key: split.id,
      category: split.expenseCategory ?? split.incomeCategory ?? "",
      amount: String(split.amount),
      memo: split.memo ?? "",
    })),
  );
  const [error, setError] = useState<string>();

  const draftTotal = drafts.reduce(
    (total, draft) => total + (Number(draft.amount) || 0),
    0,
  );

  function updateDraft(index: number, patch: Partial<SplitDraft>) {
    setDrafts((prev) =>
      prev.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)),
    );
  }

  function addDraft() {
    setDrafts((prev) => [
      ...prev,
      { key: crypto.randomUUID(), category: "", amount: "", memo: "" },
    ]);
  }

  function removeDraft(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const isExpense = entry.type === "expense";
    const splits: TransactionSplitInput[] = drafts.map((draft) => ({
      expenseCategory: isExpense && draft.category ? draft.category : undefined,
      incomeCategory: !isExpense && draft.category ? draft.category : undefined,
      amount: Number(draft.amount),
      memo: draft.memo || undefined,
    }));
    const result = await saveTransactionSplits(propertyId, entry.id, splits);
    setError(result.ok ? undefined : result.error);
  }

  return (
    <div className="grid gap-2 rounded-md border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-sm">Category splits</p>
        <span
          className={
            Math.round(draftTotal * 100) === Math.round(entry.amount * 100)
              ? "text-ready text-xs"
              : "text-blocked text-xs"
          }
        >
          {formatMoney(draftTotal)} of {formatMoney(entry.amount)}
        </span>
      </div>
      {drafts.map((draft, index) => {
        const selectedCategoryLabel =
          categoryOptions.find((option) => option.value === draft.category)
            ?.label ?? "Select category";

        return (
          <div
            key={draft.key}
            className="grid gap-2 lg:grid-cols-[1.2fr_0.8fr_1fr_auto]"
          >
            <Select
              value={draft.category || UNCATEGORIZED}
              onValueChange={(value) => {
                const nextCategory = value ?? UNCATEGORIZED;
                updateDraft(index, {
                  category: nextCategory === UNCATEGORIZED ? "" : nextCategory,
                });
              }}
            >
              <SelectTrigger
                aria-label="Split category"
                className="h-9 w-full rounded-md"
              >
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-left",
                    draft.category === "" && "text-muted-foreground",
                  )}
                >
                  {selectedCategoryLabel}
                </span>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value={UNCATEGORIZED}>Select category</SelectItem>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              aria-label="Split amount"
              type="number"
              step="0.01"
              placeholder="Amount"
              value={draft.amount}
              onChange={(event) => {
                updateDraft(index, { amount: event.target.value });
              }}
            />
            <Input
              aria-label="Split memo"
              placeholder="Memo"
              value={draft.memo}
              onChange={(event) => {
                updateDraft(index, { memo: event.target.value });
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-md text-blocked"
              onClick={() => {
                removeDraft(index);
              }}
            >
              <Trash2 data-icon="inline-start" />
              Remove
            </Button>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-md"
          onClick={addDraft}
        >
          Add split
        </Button>
        <Button
          type="button"
          size="sm"
          className="rounded-md"
          onClick={() => {
            void handleSave();
          }}
        >
          Save splits
        </Button>
      </div>
      <FormErrorAlert message={error} />
    </div>
  );
}
