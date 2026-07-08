"use client";

import { AlertTriangle, Paperclip } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, useRef, useState } from "react";

import { TransactionAllocationControls } from "@/components/evidence-binder/allocation-controls";
import {
  type UploadTransactionEvidence,
  useTransactionEvidenceUpload,
} from "@/components/evidence-binder/transaction-evidence-upload";
import { FormErrorAlert } from "@/components/property-workspace/form-error-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { setTransactionCategory } from "@/lib/allocation-actions";
import type { LedgerEntryWithSplits } from "@/lib/allocations";
import { uploadTransactionEvidence } from "@/lib/evidence-actions";
import {
  entryMatchesCategory,
  entryYear,
  formatLedgerCategory,
  INBOX_EXCEPTION_OPTIONS,
  type InboxExceptionType,
  RENTAL_INCOME_CATEGORY_OPTIONS,
  T776_CATEGORY_OPTIONS,
} from "@/lib/evidence-binder";
import { formatMoney } from "@/lib/rent-ledger";
import { toneSurface } from "@/lib/status-styles";
import { cn } from "@/lib/utils";

export type InboxRow = {
  propertyId: string;
  propertyName: string;
  entry: LedgerEntryWithSplits;
  exceptions: InboxExceptionType[];
};

type Filters = {
  propertyId: string;
  year: string;
  exception: string;
  category: string;
};

const ALL = "all";
const UNCATEGORIZED = "__uncategorized";

const EXCEPTION_LABELS: Record<InboxExceptionType, string> = {
  uncategorized: "Category",
  missing_receipt: "Receipt",
  split_mismatch: "Split",
};

export function TransactionsInbox({
  rows,
  properties,
}: {
  rows: InboxRow[];
  properties: { id: string; name: string }[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters: Filters = {
    propertyId: searchParams.get("propertyId") ?? ALL,
    year: searchParams.get("year") ?? ALL,
    exception: searchParams.get("exception") ?? ALL,
    category: searchParams.get("category") ?? ALL,
  };
  const [error, setError] = useState<string>();

  const years = Array.from(
    new Set(rows.map((row) => entryYear(row.entry))),
  ).toSorted((a, b) => b - a);

  const filtered = rows.filter((row) => {
    if (filters.propertyId !== ALL && row.propertyId !== filters.propertyId) {
      return false;
    }

    if (filters.year !== ALL && entryYear(row.entry) !== Number(filters.year)) {
      return false;
    }

    if (
      filters.exception !== ALL &&
      !row.exceptions.includes(filters.exception as InboxExceptionType)
    ) {
      return false;
    }

    if (
      filters.category !== ALL &&
      !entryMatchesCategory(row.entry, filters.category)
    ) {
      return false;
    }

    return true;
  });

  async function handleCategoryChange(row: InboxRow, value: string) {
    const result = await setTransactionCategory(
      row.propertyId,
      row.entry.id,
      value === "" ? null : value,
    );
    setError(result.ok ? undefined : result.error);
  }

  function updateFilter(name: keyof Filters, value: string) {
    const next = new URLSearchParams(searchParams.toString());

    if (value === ALL) {
      next.delete(name);
    } else {
      next.set(name, value);
    }

    const query = next.toString();
    window.history.replaceState(
      null,
      "",
      query.length > 0 ? `${pathname}?${query}` : pathname,
    );
  }

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle as="h1">Review</CardTitle>
        <CardDescription>
          Tax records that need category, receipt, or split cleanup before
          year-end.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            id="filter-property"
            label="Property"
            value={filters.propertyId}
            onChange={(propertyId) => {
              updateFilter("propertyId", propertyId);
            }}
            options={[
              { value: ALL, label: "All properties" },
              ...properties.map((property) => ({
                value: property.id,
                label: property.name,
              })),
            ]}
          />
          <FilterSelect
            id="filter-year"
            label="Tax year"
            value={filters.year}
            onChange={(year) => {
              updateFilter("year", year);
            }}
            options={[
              { value: ALL, label: "All years" },
              ...years.map((year) => ({
                value: String(year),
                label: String(year),
              })),
            ]}
          />
          <FilterSelect
            id="filter-exception"
            label="Exception type"
            value={filters.exception}
            onChange={(exception) => {
              updateFilter("exception", exception);
            }}
            options={[
              { value: ALL, label: "All exceptions" },
              ...INBOX_EXCEPTION_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              })),
            ]}
          />
          <FilterSelect
            id="filter-category"
            label="Category"
            value={filters.category}
            onChange={(category) => {
              updateFilter("category", category);
            }}
            options={[
              { value: ALL, label: "All categories" },
              ...T776_CATEGORY_OPTIONS,
              ...RENTAL_INCOME_CATEGORY_OPTIONS,
            ]}
          />
        </div>
        <FormErrorAlert message={error} />
        {filtered.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-muted-foreground text-sm">
            <AlertTriangle className="size-4" aria-hidden="true" />
            No records match these filters.
          </div>
        ) : (
          <TransactionsReviewTable
            rows={filtered}
            onCategoryChange={handleCategoryChange}
            onErrorChange={setError}
          />
        )}
      </CardContent>
    </Card>
  );
}

function TransactionsReviewTable({
  rows,
  onCategoryChange,
  onErrorChange,
}: {
  rows: InboxRow[];
  onCategoryChange: (row: InboxRow, value: string) => void;
  onErrorChange: (error: string | undefined) => void;
}) {
  return (
    <>
      <section
        aria-label="Transaction review list"
        className="grid gap-3 lg:hidden"
      >
        {rows.map((row) => (
          <TransactionsReviewListItem
            key={row.entry.id}
            row={row}
            onCategoryChange={onCategoryChange}
            onErrorChange={onErrorChange}
          />
        ))}
      </section>
      <section
        aria-label="Transaction review table"
        className="hidden lg:block"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Exceptions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TransactionsReviewRow
                key={row.entry.id}
                row={row}
                onCategoryChange={onCategoryChange}
                onErrorChange={onErrorChange}
              />
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}

function TransactionsReviewListItem({
  row,
  onCategoryChange,
  onErrorChange,
}: {
  row: InboxRow;
  onCategoryChange: (row: InboxRow, value: string) => void;
  onErrorChange: (error: string | undefined) => void;
}) {
  return (
    <article className="grid min-w-0 gap-3 rounded-md border bg-background p-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">{row.entry.vendor}</p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs">
            <Link
              className="min-w-0 truncate font-medium underline-offset-4 hover:underline"
              href={`/properties/${row.propertyId}`}
            >
              {row.propertyName}
            </Link>
            <span aria-hidden="true">·</span>
            <span>{row.entry.date}</span>
          </div>
        </div>
        <span className="shrink-0 text-right font-medium text-sm tabular-nums">
          {formatMoney(row.entry.amount)}
        </span>
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:items-start">
        <Field className="min-w-0 gap-1.5">
          <FieldLabel className="text-muted-foreground text-xs">
            Category
          </FieldLabel>
          <TransactionCategoryControl
            row={row}
            onCategoryChange={onCategoryChange}
          />
        </Field>
        <div className="grid min-w-0 gap-1.5">
          <span className="font-medium text-muted-foreground text-xs">
            Exceptions
          </span>
          <TransactionExceptionControls
            row={row}
            onErrorChange={onErrorChange}
          />
        </div>
      </div>
      <SplitMismatchControls
        row={row}
        className="rounded-md border bg-muted/30 p-3"
      />
    </article>
  );
}

function TransactionsReviewRow({
  row,
  onCategoryChange,
  onErrorChange,
}: {
  row: InboxRow;
  onCategoryChange: (row: InboxRow, value: string) => void;
  onErrorChange: (error: string | undefined) => void;
}) {
  return (
    <Fragment>
      <TableRow>
        <TableCell>
          <Link
            className="font-medium underline-offset-4 hover:underline"
            href={`/properties/${row.propertyId}`}
          >
            {row.propertyName}
          </Link>
        </TableCell>
        <TableCell>{row.entry.date}</TableCell>
        <TableCell>{row.entry.vendor}</TableCell>
        <TableCell>
          <TransactionCategoryControl
            row={row}
            onCategoryChange={onCategoryChange}
          />
        </TableCell>
        <TableCell>{formatMoney(row.entry.amount)}</TableCell>
        <TableCell>
          <TransactionExceptionControls
            row={row}
            onErrorChange={onErrorChange}
          />
        </TableCell>
      </TableRow>
      {row.exceptions.includes("split_mismatch") ? (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={6} className="whitespace-normal px-2 py-3">
            <SplitMismatchControls row={row} />
          </TableCell>
        </TableRow>
      ) : null}
    </Fragment>
  );
}

function TransactionCategoryControl({
  row,
  onCategoryChange,
}: {
  row: InboxRow;
  onCategoryChange: (row: InboxRow, value: string) => void;
}) {
  const isSplit = row.entry.splits.length > 0;
  const categoryOptions =
    row.entry.type === "expense"
      ? T776_CATEGORY_OPTIONS
      : RENTAL_INCOME_CATEGORY_OPTIONS;
  const currentCategory =
    row.entry.type === "expense"
      ? (row.entry.expenseCategory ?? "")
      : (row.entry.incomeCategory ?? "");
  const currentCategoryLabel =
    categoryOptions.find((option) => option.value === currentCategory)?.label ??
    "Uncategorized";

  if (isSplit) {
    return (
      <span className="block min-w-0 text-muted-foreground text-sm">
        {formatLedgerCategory(row.entry)} · {row.entry.splits.length} splits
      </span>
    );
  }

  return (
    <Select
      value={currentCategory || UNCATEGORIZED}
      onValueChange={(value) => {
        const nextCategory = value ?? UNCATEGORIZED;
        onCategoryChange(
          row,
          nextCategory === UNCATEGORIZED ? "" : nextCategory,
        );
      }}
    >
      <SelectTrigger aria-label="Category" className="h-9 w-full rounded-md">
        <span className="min-w-0 flex-1 truncate text-left">
          {currentCategoryLabel}
        </span>
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value={UNCATEGORIZED}>Uncategorized</SelectItem>
        {categoryOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TransactionExceptionControls({
  row,
  onErrorChange,
}: {
  row: InboxRow;
  onErrorChange: (error: string | undefined) => void;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      <ExceptionBadges exceptions={row.exceptions} />
      {row.exceptions.includes("missing_receipt") ? (
        <ReceiptUploadControl row={row} onErrorChange={onErrorChange} />
      ) : null}
    </div>
  );
}

function SplitMismatchControls({
  row,
  className,
}: {
  row: InboxRow;
  className?: string;
}) {
  if (!row.exceptions.includes("split_mismatch")) {
    return null;
  }

  return (
    <div className={className}>
      <TransactionAllocationControls
        propertyId={row.propertyId}
        entry={row.entry}
      />
    </div>
  );
}

function ExceptionBadges({ exceptions }: { exceptions: InboxExceptionType[] }) {
  if (exceptions.length === 0) {
    return (
      <Badge variant="outline" className={cn("rounded-md", toneSurface.ready)}>
        Clear
      </Badge>
    );
  }

  return exceptions.map((exception) => (
    <Badge
      key={exception}
      variant="outline"
      className={cn("rounded-md", toneSurface.blocked)}
    >
      <AlertTriangle className="size-3" aria-hidden="true" />
      {EXCEPTION_LABELS[exception]}
    </Badge>
  ));
}

function ReceiptUploadControl({
  row,
  onErrorChange,
}: {
  row: InboxRow;
  onErrorChange: (error: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleUploadEvidence: UploadTransactionEvidence = async (
    _transactionId,
    formData,
  ) => {
    const result = await uploadTransactionEvidence(
      row.propertyId,
      row.entry.id,
      formData,
    );
    onErrorChange(result.ok ? undefined : result.error);
    return result.ok;
  };
  const { isUploading, uploadFile } = useTransactionEvidenceUpload({
    transactionId: row.entry.id,
    onUploadEvidence: handleUploadEvidence,
  });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (file === undefined) {
      return;
    }

    uploadFile(input, file);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        disabled={isUploading}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-md px-2 text-xs"
        aria-label={`Attach receipt for ${row.entry.vendor}`}
        disabled={isUploading}
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        <Paperclip data-icon="inline-start" />
        {isUploading ? "Attaching" : "Attach"}
      </Button>
    </>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label ??
    options[0]?.label;

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          onChange(nextValue ?? ALL);
        }}
      >
        <SelectTrigger id={id} className="h-9 w-full rounded-md">
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedLabel}
          </span>
        </SelectTrigger>
        <SelectContent align="start">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
