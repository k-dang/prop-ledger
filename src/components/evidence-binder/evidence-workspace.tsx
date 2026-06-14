"use client";

import { FileText, type LucideIcon, Plus, Receipt, Trash2 } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { z } from "zod";
import {
  MortgagePaymentsPanel,
  TransactionAllocationControls,
} from "@/components/evidence-binder/allocation-controls";
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
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buildSourceDocumentIndex,
  formatLedgerCategory,
  getDocumentsForTarget,
  getEvidenceExceptionCounts,
  type NewManualTransactionInput,
  RENTAL_INCOME_CATEGORY_OPTIONS,
  T776_CATEGORY_OPTIONS,
} from "@/lib/evidence-binder";
import type { RentalProperty } from "@/lib/property-workspace";
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

export function EvidenceBinderPanel({
  property,
  transactionError,
  documentError,
  onCreateManualTransaction,
  onUploadTransactionEvidence,
  onDeleteEvidenceDocument,
}: {
  property: RentalProperty;
  transactionError?: string;
  documentError?: string;
  onCreateManualTransaction: (
    input: NewManualTransactionInput,
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
            <CardTitle>Transactions and evidence</CardTitle>
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
            label="Split mismatches"
            value={exceptions.splitMismatches}
          />
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <ManualTransactionsPanel
          property={property}
          error={transactionError}
          evidenceError={documentError}
          onSubmit={onCreateManualTransaction}
          onUploadEvidence={onUploadTransactionEvidence}
          onDeleteDocument={onDeleteEvidenceDocument}
        />
        <DocumentsPanel
          property={property}
          error={documentError}
          onDeleteDocument={onDeleteEvidenceDocument}
        />
      </div>
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
  onUploadEvidence,
  onDeleteDocument,
}: {
  property: RentalProperty;
  error?: string;
  evidenceError?: string;
  onSubmit: (input: NewManualTransactionInput) => boolean | Promise<boolean>;
  onUploadEvidence: (
    transactionId: string,
    formData: FormData,
  ) => boolean | Promise<boolean>;
  onDeleteDocument: (documentId: string) => boolean | Promise<boolean>;
}) {
  const [transactionType, setTransactionType] =
    useState<NewManualTransactionInput["type"]>("expense");
  const handleSubmit = createFormSubmit(manualTransactionFormSchema, onSubmit);
  const categoryOptions =
    transactionType === "expense"
      ? T776_CATEGORY_OPTIONS
      : RENTAL_INCOME_CATEGORY_OPTIONS;

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Manual transactions</CardTitle>
        <CardDescription>
          Expenses, income, categories, and review notes.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form className="grid gap-3 lg:grid-cols-6" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="transactionType">Type</FieldLabel>
            <Select
              name="type"
              value={transactionType}
              onValueChange={(value) => {
                setTransactionType(value as NewManualTransactionInput["type"]);
              }}
            >
              <SelectTrigger id="transactionType" className="w-full">
                <SelectValue />
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
          <Field className="lg:col-span-2">
            <FieldLabel htmlFor="vendor">Vendor</FieldLabel>
            <Input id="vendor" name="vendor" required />
          </Field>
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
            <Select key={transactionType} name="category" defaultValue="">
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Select" />
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
          <Field className="lg:col-span-3">
            <FieldLabel htmlFor="memo">Memo</FieldLabel>
            <Input id="memo" name="memo" />
          </Field>
          <Field className="lg:col-span-3">
            <FieldLabel htmlFor="reviewNotes">Review notes</FieldLabel>
            <Input id="reviewNotes" name="reviewNotes" />
          </Field>
          {transactionType === "expense" ? (
            <label
              className="flex items-center gap-2 text-sm lg:col-span-3"
              htmlFor="isCapitalAsset"
            >
              <Checkbox id="isCapitalAsset" name="isCapitalAsset" />
              <span>Capital asset</span>
            </label>
          ) : null}
          <div className="flex items-end lg:col-span-6">
            <Button type="submit" className="w-full sm:w-auto">
              <Plus data-icon="inline-start" />
              Add transaction
            </Button>
          </div>
        </form>
        <FormErrorAlert message={error} />
        <FormErrorAlert message={evidenceError} />
        {property.ledgerEntries.length === 0 ? (
          <EmptyState icon={Receipt}>
            No manual transactions recorded.
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Allocation</TableHead>
                <TableHead>Evidence</TableHead>
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
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>
                      <div className="font-medium">{entry.vendor}</div>
                      <div className="text-muted-foreground text-xs">
                        {entry.reviewNotes || entry.memo || "No notes"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md">
                        {formatLedgerCategory(entry)}
                      </Badge>
                    </TableCell>
                    <TableCell>${entry.amount.toFixed(2)}</TableCell>
                    <TableCell className="min-w-72">
                      <TransactionAllocationControls
                        propertyId={property.id}
                        entry={entry}
                      />
                    </TableCell>
                    <TableCell>
                      <TransactionEvidenceControl
                        documents={linked}
                        transactionId={entry.id}
                        onUploadEvidence={onUploadEvidence}
                        onDeleteDocument={onDeleteDocument}
                      />
                      {entry.type === "expense" ? (
                        <CapitalAssetControl
                          propertyId={property.id}
                          transactionId={entry.id}
                          isCapitalAsset={entry.isCapitalAsset}
                        />
                      ) : null}
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

function TransactionEvidenceControl({
  documents,
  transactionId,
  onUploadEvidence,
  onDeleteDocument,
}: {
  documents: RentalProperty["documents"];
  transactionId: string;
  onUploadEvidence: (
    transactionId: string,
    formData: FormData,
  ) => boolean | Promise<boolean>;
  onDeleteDocument: (documentId: string) => boolean | Promise<boolean>;
}) {
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
    <div className="grid gap-2">
      <Badge
        variant="outline"
        className={
          linkedCount > 0
            ? "w-fit rounded-md border-emerald-300 bg-emerald-50 text-emerald-800"
            : "w-fit rounded-md border-amber-300 bg-amber-50 text-amber-800"
        }
      >
        {linkedCount} linked
      </Badge>
      {documents.length > 0 ? (
        <div className="grid gap-1">
          {documents.map((document) => (
            <div
              className="flex min-w-0 items-center justify-between gap-2 rounded-md border bg-background px-2 py-1"
              key={document.id}
            >
              <span className="truncate text-xs">{document.fileName}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 shrink-0 rounded-md px-2 text-red-700"
                onClick={() => {
                  void onDeleteDocument(document.id);
                }}
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            </div>
          ))}
        </div>
      ) : null}
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
        <Button type="submit" size="sm" className="w-fit rounded-md">
          <Plus data-icon="inline-start" />
          {linkedCount > 0 ? "Add another" : "Attach"}
        </Button>
      </form>
    </div>
  );
}

function DocumentsPanel({
  property,
  error,
  onDeleteDocument,
}: {
  property: RentalProperty;
  error?: string;
  onDeleteDocument: (documentId: string) => boolean | Promise<boolean>;
}) {
  const index = buildSourceDocumentIndex(property.documents);
  const documentsById = new Map(
    property.documents.map((document) => [document.id, document]),
  );

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Source documents</CardTitle>
        <CardDescription>
          Uploaded evidence linked from transaction rows.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <FormErrorAlert message={error} />
        {index.length === 0 ? (
          <EmptyState icon={FileText}>No documents recorded.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Metadata</TableHead>
                <TableHead>Attached to</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {index.map((row) => {
                const document = documentsById.get(row.documentId);

                return (
                  <TableRow key={row.documentId}>
                    <TableCell>
                      <div className="font-medium">{row.fileName}</div>
                      <div className="text-muted-foreground text-xs">
                        {row.readableUrl ?? "No URL recorded"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{row.documentType}</div>
                      <div className="text-muted-foreground text-xs">
                        {[row.vendor, row.documentDate, row.amount?.toFixed(2)]
                          .filter(Boolean)
                          .join(" | ") || "No metadata"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.linkedTargets.length === 0 ? (
                          <Badge
                            variant="outline"
                            className="rounded-md border-amber-300 bg-amber-50 text-amber-800"
                          >
                            not attached
                          </Badge>
                        ) : (
                          row.linkedTargets.map((target) => (
                            <Badge
                              key={target}
                              variant="outline"
                              className="h-7 rounded-md px-2"
                            >
                              {target.split(":")[0]}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-md px-2 text-red-700"
                        disabled={document === undefined}
                        onClick={() => {
                          if (document !== undefined) {
                            void onDeleteDocument(document.id);
                          }
                        }}
                      >
                        <Trash2 data-icon="inline-start" />
                        Delete
                      </Button>
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
