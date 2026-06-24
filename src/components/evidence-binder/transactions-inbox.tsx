"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

import { FormErrorAlert } from "@/components/property-workspace/form-error-alert";
import { Badge } from "@/components/ui/badge";
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
import {
  entryMatchesCategory,
  entryYear,
  formatLedgerCategory,
  INBOX_ISSUE_OPTIONS,
  type InboxIssueType,
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
  issues: InboxIssueType[];
};

type Filters = {
  propertyId: string;
  year: string;
  issue: string;
  category: string;
};

const ALL = "all";
const UNCATEGORIZED = "__uncategorized";

const ISSUE_LABELS: Record<InboxIssueType, string> = {
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
    issue: searchParams.get("issue") ?? ALL,
    category: searchParams.get("category") ?? ALL,
  };
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string>();
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
      filters.issue !== ALL &&
      !row.issues.includes(filters.issue as InboxIssueType)
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

  const boundedActive = Math.min(activeIndex, Math.max(filtered.length - 1, 0));

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (filtered.length === 0) {
      return;
    }

    if (event.key === "j" || event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(Math.min(boundedActive + 1, filtered.length - 1));
    } else if (event.key === "k" || event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(Math.max(boundedActive - 1, 0));
    } else if (event.key === "Enter" || event.key === "e") {
      event.preventDefault();
      rowRefs.current[boundedActive]?.focus();
    }
  }

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
    setActiveIndex(0);
  }

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle as="h1">Transactions</CardTitle>
        <CardDescription>
          Rental records that need category or evidence review. Use j/k to move
          between rows and Enter to jump to the category control.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
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
            id="filter-issue"
            label="Issue type"
            value={filters.issue}
            onChange={(issue) => {
              updateFilter("issue", issue);
            }}
            options={[
              { value: ALL, label: "All issues" },
              ...INBOX_ISSUE_OPTIONS.map((option) => ({
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
            No transactions match these filters.
          </div>
        ) : (
          <section
            aria-label="Transaction review table"
            onKeyDown={handleKeyDown}
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
                {filtered.map((row, index) => {
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
                    categoryOptions.find(
                      (option) => option.value === currentCategory,
                    )?.label ?? "Uncategorized";

                  return (
                    <TableRow
                      key={row.entry.id}
                      className={cn(index === boundedActive && "bg-muted/60")}
                      onClick={() => {
                        setActiveIndex(index);
                      }}
                    >
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
                        {isSplit ? (
                          <span className="text-muted-foreground text-sm">
                            {formatLedgerCategory(row.entry)} ·{" "}
                            {row.entry.splits.length} splits
                          </span>
                        ) : (
                          <Select
                            value={currentCategory || UNCATEGORIZED}
                            onValueChange={(value) => {
                              const nextCategory = value ?? UNCATEGORIZED;
                              void handleCategoryChange(
                                row,
                                nextCategory === UNCATEGORIZED
                                  ? ""
                                  : nextCategory,
                              );
                            }}
                          >
                            <SelectTrigger
                              aria-label="Category"
                              ref={(element) => {
                                rowRefs.current[index] = element;
                              }}
                              className="h-9 w-full rounded-md"
                            >
                              <span className="flex flex-1 text-left">
                                {currentCategoryLabel}
                              </span>
                            </SelectTrigger>
                            <SelectContent align="start">
                              <SelectItem value={UNCATEGORIZED}>
                                Uncategorized
                              </SelectItem>
                              {categoryOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>{formatMoney(row.entry.amount)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.issues.length === 0 ? (
                            <Badge
                              variant="outline"
                              className={cn("rounded-md", toneSurface.ready)}
                            >
                              Clear
                            </Badge>
                          ) : (
                            row.issues.map((issue) => (
                              <Badge
                                key={issue}
                                variant="outline"
                                className={cn(
                                  "rounded-md",
                                  toneSurface.blocked,
                                )}
                              >
                                <AlertTriangle
                                  className="size-3"
                                  aria-hidden="true"
                                />
                                {ISSUE_LABELS[issue]}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </section>
        )}
      </CardContent>
    </Card>
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
          <span className="flex flex-1 text-left">{selectedLabel}</span>
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
