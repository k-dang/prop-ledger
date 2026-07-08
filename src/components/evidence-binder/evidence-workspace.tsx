"use client";

import {
  FileText,
  type LucideIcon,
  Paperclip,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState, useTransition } from "react";
import { z } from "zod";
import { CapitalAssetControl } from "@/components/evidence-binder/capital-asset-control";
import { useTransactionEvidenceUpload } from "@/components/evidence-binder/transaction-evidence-upload";
import { FormErrorAlert } from "@/components/property-workspace/form-error-alert";
import {
  finiteFormNumber,
  optionalFormString,
  requiredFormString,
} from "@/components/property-workspace/form-schemas";
import { createFormSubmit } from "@/components/property-workspace/form-submit";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createEmptyManualTransactionDraft,
  formatLedgerCategory,
  getDocumentsForTarget,
  getEvidenceExceptionCounts,
  type ManualTransactionFormDraft,
  type NewManualTransactionInput,
  RENTAL_INCOME_CATEGORY_OPTIONS,
  T776_CATEGORY_OPTIONS,
} from "@/lib/evidence-binder";
import type { RentalProperty } from "@/lib/property-workspace";
import { toneIcon, toneSurface } from "@/lib/status-styles";
import { cn } from "@/lib/utils";

const manualTransactionFormSchema = z
  .object({
    type: z.enum(["expense", "income"]),
    date: requiredFormString,
    vendor: requiredFormString,
    memo: optionalFormString,
    amount: finiteFormNumber,
    category: optionalFormString,
    isCapitalAsset: z.preprocess((value) => value === "on", z.boolean()),
    reviewNotes: optionalFormString,
  })
  .transform(
    (data): NewManualTransactionInput => ({
      type: data.type,
      date: data.date,
      vendor: data.vendor,
      memo: data.memo,
      amount: data.amount,
      expenseCategory:
        data.type === "expense" && data.category !== undefined
          ? (data.category as NewManualTransactionInput["expenseCategory"])
          : undefined,
      incomeCategory:
        data.type === "income" && data.category !== undefined
          ? (data.category as NewManualTransactionInput["incomeCategory"])
          : undefined,
      isCapitalAsset: data.type === "expense" && data.isCapitalAsset,
      reviewNotes: data.reviewNotes,
    }),
  );

const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

export function EvidenceBinderPanel({
  property,
  className,
}: {
  property: RentalProperty;
  className?: string;
}) {
  const exceptions = getEvidenceExceptionCounts({
    ledgerEntries: property.ledgerEntries,
    documents: property.documents,
  });
  const hasOpenReview =
    exceptions.uncategorizedTransactions > 0 || exceptions.missingReceipts > 0;

  if (!hasOpenReview) {
    return null;
  }

  return (
    <section id="transactions" className={cn("scroll-mt-4", className)}>
      <div
        className={cn(
          "grid gap-3 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center",
          toneSurface.review,
        )}
      >
        <div className="min-w-0">
          <h3 className="font-medium text-foreground text-sm">Review needed</h3>
          <p className="mt-0.5 max-w-2xl text-review-text text-sm">
            Records still need categories or receipts before year-end.
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-5 gap-y-2 sm:justify-self-end">
          <ExceptionMetric
            label="Uncategorized"
            value={exceptions.uncategorizedTransactions}
          />
          <ExceptionMetric
            label="Missing receipts"
            value={exceptions.missingReceipts}
          />
        </dl>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1 lg:justify-self-end">
          <Link
            href="/transactions"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-md !no-underline hover:!no-underline",
            )}
          >
            <Receipt data-icon="inline-start" />
            Review
          </Link>
          <Link
            href="/documents"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-md !no-underline hover:!no-underline",
            )}
          >
            <FileText data-icon="inline-start" />
            Documents
          </Link>
        </div>
      </div>
    </section>
  );
}

function ExceptionMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-24">
      <dt className="text-review-text text-xs">{label}</dt>
      <dd className="mt-0.5 font-semibold text-foreground text-lg tabular-nums">
        {value}
      </dd>
    </div>
  );
}

export function DeductionsAndIncomePanel({
  property,
  error,
  evidenceError,
  className,
  onSubmit,
  onDeleteTransaction,
  onUploadEvidence,
  onDeleteDocument,
}: {
  property: RentalProperty;
  error?: string;
  evidenceError?: string;
  className?: string;
  onSubmit: (input: NewManualTransactionInput) => boolean | Promise<boolean>;
  onDeleteTransaction: (transactionId: string) => boolean | Promise<boolean>;
  onUploadEvidence: (
    transactionId: string,
    formData: FormData,
  ) => boolean | Promise<boolean>;
  onDeleteDocument: (documentId: string) => boolean | Promise<boolean>;
}) {
  const entries = property.ledgerEntries.toSorted((a, b) =>
    b.date.localeCompare(a.date),
  );
  const incomeTotal = property.ledgerEntries
    .filter((entry) => entry.type === "income")
    .reduce((total, entry) => total + entry.amount, 0);
  const expenseTotal = property.ledgerEntries
    .filter((entry) => entry.type === "expense")
    .reduce((total, entry) => total + entry.amount, 0);
  return (
    <Card className={cn("rounded-md", className)}>
      <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <CardTitle as="h2">Deductions & non-rent income</CardTitle>
          <CardDescription>
            Deductible expenses, capital assets, and income that is not tenant
            rent.
          </CardDescription>
        </div>
        <div className="sm:justify-self-end">
          <AddManualTransactionSheet onSubmit={onSubmit} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <FormErrorAlert message={error} />
        <FormErrorAlert message={evidenceError} />
        <div className="grid overflow-hidden rounded-md border bg-muted/30 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
          <SummaryMetric
            label="Records"
            value={property.ledgerEntries.length}
          />
          <SummaryMetric
            label="Non-rent income"
            value={formatMoney(incomeTotal)}
          />
          <SummaryMetric label="Expenses" value={formatMoney(expenseTotal)} />
          <SummaryMetric
            label="Net"
            value={formatMoney(incomeTotal - expenseTotal)}
          />
        </div>
        {property.ledgerEntries.length === 0 ? (
          <EmptyState icon={Receipt}>
            No deductions or non-rent income recorded.
          </EmptyState>
        ) : (
          <TransactionRecordsLedger
            documents={property.documents}
            entries={entries}
            propertyId={property.id}
            onDeleteDocument={onDeleteDocument}
            onDeleteTransaction={onDeleteTransaction}
            onUploadEvidence={onUploadEvidence}
          />
        )}
      </CardContent>
    </Card>
  );
}

function TransactionRecordsLedger({
  documents,
  entries,
  propertyId,
  onDeleteDocument,
  onDeleteTransaction,
  onUploadEvidence,
}: {
  documents: RentalProperty["documents"];
  entries: RentalProperty["ledgerEntries"];
  propertyId: string;
  onDeleteDocument: (documentId: string) => boolean | Promise<boolean>;
  onDeleteTransaction: (transactionId: string) => boolean | Promise<boolean>;
  onUploadEvidence: (
    transactionId: string,
    formData: FormData,
  ) => boolean | Promise<boolean>;
}) {
  return (
    <div className="max-h-80 overflow-y-auto rounded-md border bg-background">
      <Table
        aria-label="Deduction and non-rent income records"
        className="min-w-[34rem] table-fixed"
      >
        <colgroup>
          <col className="w-[6.75rem]" />
          <col />
          <col className="w-[7.5rem]" />
          <col className="w-[4.5rem]" />
        </colgroup>
        <TableHeader className="sticky top-0 z-10 bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-8 px-2 text-muted-foreground text-xs">
              Date
            </TableHead>
            <TableHead className="h-8 px-2 text-muted-foreground text-xs">
              Record
            </TableHead>
            <TableHead className="h-8 px-2 text-right text-muted-foreground text-xs">
              Amount
            </TableHead>
            <TableHead className="h-8 px-2">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TransactionRecordRow
              documents={documents}
              entry={entry}
              key={entry.id}
              propertyId={propertyId}
              onDeleteDocument={onDeleteDocument}
              onDeleteTransaction={onDeleteTransaction}
              onUploadEvidence={onUploadEvidence}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TransactionRecordRow({
  entry,
  documents,
  propertyId,
  onDeleteDocument,
  onDeleteTransaction,
  onUploadEvidence,
}: {
  entry: RentalProperty["ledgerEntries"][number];
  documents: RentalProperty["documents"];
  propertyId: string;
  onDeleteDocument: (documentId: string) => boolean | Promise<boolean>;
  onDeleteTransaction: (transactionId: string) => boolean | Promise<boolean>;
  onUploadEvidence: (
    transactionId: string,
    formData: FormData,
  ) => boolean | Promise<boolean>;
}) {
  const linked = getDocumentsForTarget(documents, "transaction", entry.id);
  const category = formatLedgerCategory(entry);
  const note = entry.reviewNotes || entry.memo;
  const isUncategorized = category.startsWith("Uncategorized");
  const typeLabel = entry.type === "income" ? "Income" : "Expense";

  return (
    <TableRow>
      <TableCell className="px-2 py-2 text-muted-foreground tabular-nums">
        <time dateTime={entry.date}>{entry.date}</time>
      </TableCell>
      <TableCell className="min-w-0 whitespace-normal px-2 py-2 align-top">
        <p className="min-w-0 truncate font-medium text-sm">{entry.vendor}</p>
        <p className="mt-0.5 truncate text-muted-foreground text-xs">
          <span>{typeLabel}</span>
          <span> · </span>
          <span className={cn(isUncategorized && toneIcon.review)}>
            {category}
          </span>
          {note ? <span> · {note}</span> : null}
        </p>
      </TableCell>
      <TableCell className="px-2 py-2 text-right">
        <span className="block font-semibold tabular-nums text-sm">
          {formatMoney(entry.amount)}
        </span>
      </TableCell>
      <TableCell className="px-2 py-2">
        <div className="flex items-center justify-end gap-1">
          <TransactionEvidenceControl
            compact
            documents={linked}
            transaction={entry}
            transactionId={entry.id}
            capitalAssetControl={
              entry.type === "expense" ? (
                <CapitalAssetControl
                  propertyId={propertyId}
                  transactionId={entry.id}
                  isCapitalAsset={entry.isCapitalAsset}
                />
              ) : null
            }
            onUploadEvidence={onUploadEvidence}
            onDeleteDocument={onDeleteDocument}
          />
          <DeleteTransactionButton
            transactionId={entry.id}
            vendor={entry.vendor}
            onDelete={onDeleteTransaction}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

function AddManualTransactionSheet({
  onSubmit,
}: {
  onSubmit: (input: NewManualTransactionInput) => boolean | Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [draft, setDraft] = useState(createEmptyManualTransactionDraft);
  const transactionType = draft.type;
  const categoryOptions =
    transactionType === "expense"
      ? T776_CATEGORY_OPTIONS
      : RENTAL_INCOME_CATEGORY_OPTIONS;
  const selectedCategoryLabel =
    categoryOptions.find((category) => category.value === draft.category)
      ?.label ?? "Select";
  const resetFormState = () => {
    setDraft(createEmptyManualTransactionDraft());
    setFormKey((key) => key + 1);
  };
  const handleSubmit = createFormSubmit(
    manualTransactionFormSchema,
    async (input) => {
      const saved = await onSubmit(input);

      if (saved) {
        resetFormState();
        setOpen(false);
      }

      return saved;
    },
  );

  function updateDraft(patch: Partial<ManualTransactionFormDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetFormState();
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        Add expense or income
      </Button>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Add expense or non-rent income</SheetTitle>
          <SheetDescription>
            Use this for deductible expenses, capital assets, laundry, parking,
            fees, or recoveries. Tenant rent payments stay under Rental income.
          </SheetDescription>
        </SheetHeader>
        <form
          className="grid gap-4 px-4 pb-4"
          key={formKey}
          onSubmit={handleSubmit}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="transactionType">Type</FieldLabel>
              <Select
                name="type"
                value={transactionType}
                onValueChange={(value) => {
                  updateDraft({
                    type: value as NewManualTransactionInput["type"],
                    category: "",
                  });
                }}
              >
                <SelectTrigger id="transactionType" className="w-full">
                  <span className="flex flex-1 text-left">
                    {transactionType === "expense"
                      ? "Expense"
                      : "Non-rent income"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Non-rent income</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="transactionDate">Date</FieldLabel>
              <DatePickerField
                id="transactionDate"
                name="date"
                required
                value={draft.date}
                onChange={(date) => {
                  updateDraft({ date });
                }}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="vendor">
              {transactionType === "income" ? "Payer" : "Vendor"}
            </FieldLabel>
            <Input
              id="vendor"
              name="vendor"
              required
              value={draft.vendor}
              onChange={(event) => {
                updateDraft({ vendor: event.target.value });
              }}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="amount">Amount</FieldLabel>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={draft.amount}
                onChange={(event) => {
                  updateDraft({ amount: event.target.value });
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="category">Category</FieldLabel>
              <Select
                key={transactionType}
                name="category"
                value={draft.category}
                onValueChange={(value) => {
                  updateDraft({ category: value ?? "" });
                }}
              >
                <SelectTrigger id="category" className="w-full">
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-left",
                      draft.category === "" && "text-muted-foreground",
                    )}
                  >
                    {selectedCategoryLabel}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="memo">Memo</FieldLabel>
            <Input
              id="memo"
              name="memo"
              value={draft.memo}
              onChange={(event) => {
                updateDraft({ memo: event.target.value });
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="reviewNotes">Tax review note</FieldLabel>
            <Input
              aria-describedby="reviewNotes-description"
              id="reviewNotes"
              name="reviewNotes"
              value={draft.reviewNotes}
              onChange={(event) => {
                updateDraft({ reviewNotes: event.target.value });
              }}
            />
            <FieldDescription id="reviewNotes-description">
              Optional tax treatment context, like capital vs. repair, prepaid
              period, or personal-use portion.
            </FieldDescription>
          </Field>
          {transactionType === "expense" ? (
            <FieldLabel
              className="flex items-center gap-2 text-sm"
              htmlFor="isCapitalAsset"
            >
              <Checkbox id="isCapitalAsset" name="isCapitalAsset" />
              <span>Capital asset</span>
            </FieldLabel>
          ) : null}
          <Button type="submit" className="justify-self-start">
            <Plus data-icon="inline-start" />
            Add record
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-semibold tabular-nums text-sm">{value}</p>
    </div>
  );
}

function DeleteTransactionButton({
  transactionId,
  vendor,
  onDelete,
}: {
  transactionId: string;
  vendor: string;
  onDelete: (transactionId: string) => boolean | Promise<boolean>;
}) {
  const [isDeleting, startDelete] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        "Delete this tax record? Linked documents will remain in Documents.",
      )
    ) {
      return;
    }

    startDelete(async () => {
      await onDelete(transactionId);
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      aria-label={`Delete tax record from ${vendor}`}
      title="Delete tax record"
      disabled={isDeleting}
      onClick={handleDelete}
    >
      <Trash2 aria-hidden="true" />
    </Button>
  );
}

function TransactionEvidenceControl({
  documents,
  transaction,
  transactionId,
  capitalAssetControl,
  compact = false,
  onUploadEvidence,
  onDeleteDocument,
}: {
  documents: RentalProperty["documents"];
  transaction: RentalProperty["ledgerEntries"][number];
  transactionId: string;
  capitalAssetControl: ReactNode;
  compact?: boolean;
  onUploadEvidence: (
    transactionId: string,
    formData: FormData,
  ) => boolean | Promise<boolean>;
  onDeleteDocument: (documentId: string) => boolean | Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const fileInputId = `evidence-${transactionId}`;
  const linkedCount = documents.length;
  const { isUploading, uploadForm } = useTransactionEvidenceUpload({
    transactionId,
    onUploadEvidence,
  });
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    uploadForm(event.currentTarget);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant={compact ? "ghost" : "outline"}
        size="sm"
        className={cn(
          "h-7 rounded-md px-2",
          compact
            ? cn(
                "gap-1 px-1.5 text-muted-foreground",
                linkedCount > 0 ? toneIcon.ready : toneIcon.review,
              )
            : linkedCount > 0
              ? toneSurface.ready
              : toneSurface.review,
        )}
        title="Manage evidence"
        aria-label={`Manage evidence for ${transaction.vendor}: ${linkedCount} linked`}
        onClick={() => {
          setOpen(true);
        }}
      >
        <Paperclip data-icon="inline-start" />
        {compact ? linkedCount : `${linkedCount} linked`}
      </Button>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Evidence</SheetTitle>
          <SheetDescription>
            Attach source documents and classification support for{" "}
            {transaction.vendor}.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-5 px-4 pb-4">
          <div className="grid gap-2 rounded-md border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-sm">{transaction.vendor}</span>
              <span className="font-semibold tabular-nums text-sm">
                {formatMoney(transaction.amount)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-muted-foreground text-xs">
              <span>{transaction.date}</span>
              <span>{formatLedgerCategory(transaction)}</span>
            </div>
          </div>

          {capitalAssetControl ? (
            <section className="grid gap-2">
              <h3 className="font-medium text-sm">Classification</h3>
              <div>{capitalAssetControl}</div>
            </section>
          ) : null}

          <section className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium text-sm">Linked documents</h3>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-md",
                  linkedCount > 0 ? toneSurface.ready : toneSurface.review,
                )}
              >
                {linkedCount} linked
              </Badge>
            </div>
            {documents.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-muted-foreground text-sm">
                <FileText className="size-4 shrink-0" aria-hidden="true" />
                No receipt attached.
              </div>
            ) : (
              <div className="grid gap-2">
                {documents.map((document) => (
                  <div
                    className="flex min-w-0 items-center gap-2 rounded-md border bg-background px-2 py-1.5"
                    key={document.id}
                  >
                    <FileText
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {document.fileName}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 text-blocked"
                      aria-label={`Delete ${document.fileName}`}
                      onClick={() => {
                        void onDeleteDocument(document.id);
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <form className="grid gap-2" onSubmit={handleSubmit}>
            <Field className="gap-1">
              <FieldLabel htmlFor={fileInputId}>Receipt or invoice</FieldLabel>
              <Input
                id={fileInputId}
                name="file"
                type="file"
                accept="application/pdf,image/*"
                required
                disabled={isUploading}
              />
            </Field>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-fit rounded-md"
              disabled={isUploading}
            >
              <Plus data-icon="inline-start" />
              {isUploading
                ? "Attaching..."
                : linkedCount > 0
                  ? "Add receipt"
                  : "Attach receipt"}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatMoney(value: number) {
  return currencyFormatter.format(value);
}

function EmptyState({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-muted-foreground text-sm">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
