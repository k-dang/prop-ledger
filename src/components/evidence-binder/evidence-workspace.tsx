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
import { MortgagePaymentsPanel } from "@/components/evidence-binder/allocation-controls";
import { CapitalAssetControl } from "@/components/evidence-binder/capital-asset-control";
import { FormErrorAlert } from "@/components/property-workspace/form-error-alert";
import {
  finiteFormNumber,
  optionalFormString,
  requiredFormString,
} from "@/components/property-workspace/form-schemas";
import {
  createFormSubmit,
  type FormSubmitHandler,
} from "@/components/property-workspace/form-submit";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
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
  formatLedgerCategory,
  getDocumentsForTarget,
  getEvidenceExceptionCounts,
  type NewManualTransactionInput,
  RENTAL_INCOME_CATEGORY_OPTIONS,
  T776_CATEGORY_OPTIONS,
} from "@/lib/evidence-binder";
import type { RentalProperty } from "@/lib/property-workspace";
import { toneSurface } from "@/lib/status-styles";
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
  transactionError,
  documentError,
  onCreateManualTransaction,
  onDeleteManualTransaction,
  onUploadTransactionEvidence,
  onDeleteEvidenceDocument,
}: {
  property: RentalProperty;
  transactionError?: string;
  documentError?: string;
  onCreateManualTransaction: (
    input: NewManualTransactionInput,
  ) => boolean | Promise<boolean>;
  onDeleteManualTransaction: (
    transactionId: string,
  ) => boolean | Promise<boolean>;
  onUploadTransactionEvidence: (
    transactionId: string,
    formData: FormData,
  ) => boolean | Promise<boolean>;
  onDeleteEvidenceDocument: (documentId: string) => boolean | Promise<boolean>;
}) {
  const exceptions = getEvidenceExceptionCounts({
    ledgerEntries: property.ledgerEntries,
    documents: property.documents,
  });

  return (
    <div className="grid gap-4">
      <Card className="rounded-md">
        <CardHeader className="gap-3 lg:grid-cols-[1fr_auto]">
          <div>
            <CardTitle as="h2">Transactions and evidence</CardTitle>
            <CardDescription>
              Manual records, source documents, and open review exceptions.
            </CardDescription>
          </div>
          <CardAction className="flex flex-wrap gap-2">
            <Link
              href="/transactions"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-md",
              )}
            >
              <Receipt data-icon="inline-start" />
              Transactions
            </Link>
            <Link
              href="/documents"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-md",
              )}
            >
              <FileText data-icon="inline-start" />
              Documents
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <ExceptionTile
            label="Uncategorized"
            value={exceptions.uncategorizedTransactions}
          />
          <ExceptionTile
            label="Missing receipts"
            value={exceptions.missingReceipts}
          />
          <ExceptionTile
            label="With evidence"
            value={
              property.ledgerEntries.filter(
                (entry) =>
                  getDocumentsForTarget(
                    property.documents,
                    "transaction",
                    entry.id,
                  ).length > 0,
              ).length
            }
          />
        </CardContent>
      </Card>
      <ManualTransactionsPanel
        property={property}
        error={transactionError}
        evidenceError={documentError}
        onSubmit={onCreateManualTransaction}
        onDeleteTransaction={onDeleteManualTransaction}
        onUploadEvidence={onUploadTransactionEvidence}
        onDeleteDocument={onDeleteEvidenceDocument}
      />
      <MortgagePaymentsPanel
        propertyId={property.id}
        payments={property.mortgagePayments}
      />
    </div>
  );
}

function ExceptionTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-semibold text-2xl">{value}</p>
    </div>
  );
}

function ManualTransactionsPanel({
  property,
  error,
  evidenceError,
  onSubmit,
  onDeleteTransaction,
  onUploadEvidence,
  onDeleteDocument,
}: {
  property: RentalProperty;
  error?: string;
  evidenceError?: string;
  onSubmit: (input: NewManualTransactionInput) => boolean | Promise<boolean>;
  onDeleteTransaction: (transactionId: string) => boolean | Promise<boolean>;
  onUploadEvidence: (
    transactionId: string,
    formData: FormData,
  ) => boolean | Promise<boolean>;
  onDeleteDocument: (documentId: string) => boolean | Promise<boolean>;
}) {
  const [transactionType, setTransactionType] =
    useState<NewManualTransactionInput["type"]>("expense");
  const incomeTotal = property.ledgerEntries
    .filter((entry) => entry.type === "income")
    .reduce((total, entry) => total + entry.amount, 0);
  const expenseTotal = property.ledgerEntries
    .filter((entry) => entry.type === "expense")
    .reduce((total, entry) => total + entry.amount, 0);

  return (
    <Card className="rounded-md">
      <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <CardTitle as="h2">Manual transactions</CardTitle>
          <CardDescription>
            Review records, categorization, and attached source evidence.
          </CardDescription>
        </div>
        <CardAction>
          <AddManualTransactionSheet
            transactionType={transactionType}
            onTransactionTypeChange={setTransactionType}
            onSubmit={onSubmit}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <FormErrorAlert message={error} />
        <FormErrorAlert message={evidenceError} />
        <div className="grid gap-2 sm:grid-cols-4">
          <SummaryMetric
            label="Records"
            value={property.ledgerEntries.length}
          />
          <SummaryMetric label="Income" value={formatMoney(incomeTotal)} />
          <SummaryMetric label="Expenses" value={formatMoney(expenseTotal)} />
          <SummaryMetric
            label="Net"
            value={formatMoney(incomeTotal - expenseTotal)}
          />
        </div>
        {property.ledgerEntries.length === 0 ? (
          <EmptyState icon={Receipt}>
            No manual transactions recorded.
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="min-w-64">Transaction</TableHead>
                <TableHead className="w-32 text-right">Amount</TableHead>
                <TableHead className="w-48">Evidence</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {property.ledgerEntries.map((entry) => {
                const linked = getDocumentsForTarget(
                  property.documents,
                  "transaction",
                  entry.id,
                );

                return (
                  <TableRow key={entry.id}>
                    <TableCell className="align-top text-muted-foreground text-sm">
                      {entry.date}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{entry.vendor}</span>
                        <Badge variant="outline" className="rounded-md">
                          {formatLedgerCategory(entry)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-md",
                            entry.type === "income"
                              ? toneSurface.ready
                              : toneSurface.info,
                          )}
                        >
                          {entry.type === "income" ? "Income" : "Expense"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground text-xs">
                        {entry.reviewNotes || entry.memo || "No notes"}
                      </p>
                    </TableCell>
                    <TableCell className="align-top text-right font-semibold">
                      {formatMoney(entry.amount)}
                    </TableCell>
                    <TableCell className="align-top">
                      <TransactionEvidenceControl
                        documents={linked}
                        transaction={entry}
                        transactionId={entry.id}
                        capitalAssetControl={
                          entry.type === "expense" ? (
                            <CapitalAssetControl
                              propertyId={property.id}
                              transactionId={entry.id}
                              isCapitalAsset={entry.isCapitalAsset}
                            />
                          ) : null
                        }
                        onUploadEvidence={onUploadEvidence}
                        onDeleteDocument={onDeleteDocument}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <DeleteTransactionButton
                        transactionId={entry.id}
                        vendor={entry.vendor}
                        onDelete={onDeleteTransaction}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AddManualTransactionSheet({
  transactionType,
  onTransactionTypeChange,
  onSubmit,
}: {
  transactionType: NewManualTransactionInput["type"];
  onTransactionTypeChange: (
    transactionType: NewManualTransactionInput["type"],
  ) => void;
  onSubmit: (input: NewManualTransactionInput) => boolean | Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const categoryOptions =
    transactionType === "expense"
      ? T776_CATEGORY_OPTIONS
      : RENTAL_INCOME_CATEGORY_OPTIONS;
  const selectedCategoryLabel =
    categoryOptions.find((category) => category.value === selectedCategory)
      ?.label ?? "Select";
  const handleSubmit = createFormSubmit(
    manualTransactionFormSchema,
    async (input) => {
      const saved = await onSubmit(input);

      if (saved) {
        setSelectedCategory("");
        setOpen(false);
      }

      return saved;
    },
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        Add transaction
      </Button>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Add manual transaction</SheetTitle>
          <SheetDescription>
            Record one income or expense line and classify it for year-end
            review.
          </SheetDescription>
        </SheetHeader>
        <form className="grid gap-4 px-4 pb-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="transactionType">Type</FieldLabel>
              <Select
                name="type"
                value={transactionType}
                onValueChange={(value) => {
                  onTransactionTypeChange(
                    value as NewManualTransactionInput["type"],
                  );
                  setSelectedCategory("");
                }}
              >
                <SelectTrigger id="transactionType" className="w-full">
                  <span className="flex flex-1 text-left">
                    {transactionType === "expense" ? "Expense" : "Income"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="transactionDate">Date</FieldLabel>
              <Input id="transactionDate" name="date" type="date" required />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="vendor">Vendor</FieldLabel>
            <Input id="vendor" name="vendor" required />
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
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="category">Category</FieldLabel>
              <Select
                key={transactionType}
                name="category"
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value ?? "");
                }}
              >
                <SelectTrigger id="category" className="w-full">
                  <span
                    className={cn(
                      "flex flex-1 text-left",
                      selectedCategory === "" && "text-muted-foreground",
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
            <Input id="memo" name="memo" />
          </Field>
          <Field>
            <FieldLabel htmlFor="reviewNotes">Review notes</FieldLabel>
            <Input id="reviewNotes" name="reviewNotes" />
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
            Add transaction
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
    <div className="rounded-md border bg-background p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-semibold text-lg">{value}</p>
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
        "Delete this transaction? Linked documents will remain in Documents.",
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
      variant="destructive"
      size="icon-sm"
      aria-label={`Delete transaction from ${vendor}`}
      title="Delete transaction"
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
  onUploadEvidence,
  onDeleteDocument,
}: {
  documents: RentalProperty["documents"];
  transaction: RentalProperty["ledgerEntries"][number];
  transactionId: string;
  capitalAssetControl: ReactNode;
  onUploadEvidence: (
    transactionId: string,
    formData: FormData,
  ) => boolean | Promise<boolean>;
  onDeleteDocument: (documentId: string) => boolean | Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const fileInputId = `evidence-${transactionId}`;
  const linkedCount = documents.length;
  const handleSubmit: FormSubmitHandler = (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    void Promise.resolve(
      onUploadEvidence(transactionId, new FormData(form)),
    ).then((saved) => {
      if (saved) {
        form.reset();
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex flex-wrap items-center gap-2">
        <Paperclip className="size-3.5 text-muted-foreground" />
        <Badge
          variant="outline"
          className={cn(
            "w-fit rounded-md",
            linkedCount > 0 ? toneSurface.ready : toneSurface.review,
          )}
        >
          {linkedCount} linked
        </Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-md"
          onClick={() => {
            setOpen(true);
          }}
        >
          Manage
        </Button>
      </div>
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
              />
            </Field>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-fit rounded-md"
            >
              <Plus data-icon="inline-start" />
              {linkedCount > 0 ? "Add receipt" : "Attach receipt"}
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
