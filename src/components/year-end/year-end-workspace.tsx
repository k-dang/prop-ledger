import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Search,
} from "lucide-react";
import Link from "next/link";
import { CapitalRegister } from "@/components/capital-assets/capital-register";
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
  PackageExportPanel,
  type PackageHistoryItem,
} from "@/components/year-end/package-export-panel";
import type { AccountantNote } from "@/db/schema";
import type { RentalProperty } from "@/lib/property-workspace";
import { formatDisplayDate, formatPercent } from "@/lib/property-workspace";
import { cn } from "@/lib/utils";
import type {
  OwnershipReadinessWarning,
  ReadinessStatus,
  YearEndReadiness,
  YearEndReadinessItem,
  YearEndReadinessItemId,
} from "@/lib/year-end-readiness";

export function YearEndWorkspace({
  properties,
  property,
  readiness,
  year,
  notes,
  packages,
}: {
  properties: { id: string; name: string }[];
  property: RentalProperty;
  readiness: YearEndReadiness;
  year: number;
  notes: AccountantNote[];
  packages: PackageHistoryItem[];
}) {
  return (
    <section className="grid gap-4">
      <YearEndSelector
        properties={properties}
        selectedPropertyId={property.id}
        selectedYear={year}
      />
      <ReadinessPanel readiness={readiness} />
      <PackageExportPanel
        property={property}
        year={year}
        notes={notes}
        packages={packages}
      />
      <CapitalRegister property={property} year={year} />
    </section>
  );
}

function YearEndSelector({
  properties,
  selectedPropertyId,
  selectedYear,
}: {
  properties: { id: string; name: string }[];
  selectedPropertyId: string;
  selectedYear: number;
}) {
  return (
    <Card className="rounded-md">
      <CardHeader className="gap-3 lg:grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Year-end readiness</CardTitle>
          <CardDescription>
            Live exception checklist for accountant-ready records.
          </CardDescription>
        </div>
        <CardAction>
          <Badge variant="outline" className="rounded-md">
            {selectedYear}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
          <Field>
            <FieldLabel htmlFor="propertyId">Property</FieldLabel>
            <Select name="propertyId" defaultValue={selectedPropertyId}>
              <SelectTrigger id="propertyId" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="year">Tax year</FieldLabel>
            <Input
              id="year"
              name="year"
              type="number"
              min="2000"
              max="2100"
              defaultValue={selectedYear}
            />
          </Field>
          <Button type="submit" size="lg" className="rounded-md">
            <Search data-icon="inline-start" aria-hidden="true" />
            Review
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ReadinessPanel({ readiness }: { readiness: YearEndReadiness }) {
  const rows = readiness.items.map((item) =>
    toReadinessRow(item, readiness.propertyId, readiness.taxYear),
  );

  return (
    <Card className="rounded-md">
      <CardHeader className="gap-3 lg:grid-cols-[1fr_auto]">
        <div>
          <CardTitle>{readiness.propertyName}</CardTitle>
          <CardDescription>
            Blocking items should be resolved before export; warnings stay
            visible for review.
          </CardDescription>
        </div>
        <CardAction className="flex flex-wrap justify-end gap-2">
          <ReadinessBadge status="blocking" count={readiness.blockingCount} />
          <ReadinessBadge status="warning" count={readiness.warningCount} />
          <ReadinessBadge status="clear" count={readiness.clearCount} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="Uncategorized"
            value={readiness.uncategorizedTransactions}
          />
          <Metric label="Missing receipts" value={readiness.missingReceipts} />
          <Metric
            label="Capital marked"
            value={readiness.capitalAssetTransactions}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Check</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead>Surface</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-2">
                    <StatusIcon status={item.status} />
                    {item.label}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status} count={item.count} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.detail}
                </TableCell>
                <TableCell>
                  <Link
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: "link", size: "sm" }),
                      "h-auto p-0",
                    )}
                  >
                    <ClipboardCheck
                      data-icon="inline-start"
                      aria-hidden="true"
                    />
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

type ReadinessRow = {
  id: YearEndReadinessItemId;
  label: string;
  status: ReadinessStatus;
  count: number;
  detail: string;
  href: string;
};

function toReadinessRow(
  item: YearEndReadinessItem,
  propertyId: string,
  taxYear: number,
): ReadinessRow {
  switch (item.id) {
    case "uncategorized_transactions":
      return {
        ...item,
        label: "Uncategorized transactions",
        detail:
          item.count > 0
            ? `${item.count} transaction${plural(item.count)} need${item.count === 1 ? "s" : ""} a category before export.`
            : "All transactions for this year have a category or split.",
        href: "/transactions",
      };
    case "missing_documents":
      return {
        ...item,
        label: "Missing documents",
        detail:
          item.count > 0
            ? `${item.count} expense${plural(item.count)} need${item.count === 1 ? "s" : ""} receipt or invoice support.`
            : "Expense records for this year have supporting documents.",
        href: "/transactions",
      };
    case "capital_assets":
      return {
        ...item,
        label: "Marked capital assets",
        detail:
          item.count > 0
            ? `${item.count} marked capital transaction${plural(item.count)} need accountant review; ${item.supportedCapitalTransactions} have support attached.`
            : "No capital asset transactions are marked for this year.",
        href: `/year-end?propertyId=${propertyId}&year=${taxYear}`,
      };
    case "ownership_allocations":
      return {
        ...item,
        label: "Ownership allocations",
        detail:
          item.ownershipWarning === null
            ? "Ownership shares total 100% through the active part of this tax year."
            : formatOwnershipWarning(item.ownershipWarning),
        href: `/properties/${propertyId}`,
      };
    default:
      return assertNever(item);
  }
}

function formatOwnershipWarning(warning: OwnershipReadinessWarning) {
  if (warning.code === "incomplete_ownership_total") {
    return `Ownership shares total ${formatPercent(warning.totalPercentage)}% on ${formatDisplayDate(warning.date)}.`;
  }

  if (warning.validationCode === "OVER_ALLOCATED") {
    const total =
      warning.totalPercentage === undefined
        ? ""
        : ` ${formatPercent(warning.totalPercentage)}%`;
    const date =
      warning.date === undefined
        ? ""
        : ` on ${formatDisplayDate(warning.date)}`;

    return `Active ownership shares cannot exceed 100 percent.${total}${date}.`;
  }

  if (warning.validationCode === "INVALID_DATE_RANGE") {
    return "Review ownership effective dates before export.";
  }

  return "Review ownership percentages before export.";
}

function assertNever(value: never): never {
  throw new Error(`Unhandled readiness item: ${JSON.stringify(value)}`);
}

function plural(count: number) {
  return count === 1 ? "" : "s";
}

function ReadinessBadge({
  status,
  count,
}: {
  status: ReadinessStatus;
  count: number;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-md", statusClassName(status))}
    >
      {count} {status}
    </Badge>
  );
}

function StatusBadge({
  status,
  count,
}: {
  status: ReadinessStatus;
  count: number;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-md", statusClassName(status))}
    >
      {status === "clear" ? "clear" : `${count} ${status}`}
    </Badge>
  );
}

function StatusIcon({ status }: { status: ReadinessStatus }) {
  if (status === "clear") {
    return <CheckCircle2 className="size-4 text-emerald-700" />;
  }

  if (status === "warning") {
    return <CircleDot className="size-4 text-amber-700" />;
  }

  return <AlertTriangle className="size-4 text-red-700" />;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-semibold text-2xl">{value}</p>
    </div>
  );
}

function statusClassName(status: ReadinessStatus) {
  if (status === "clear") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (status === "warning") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  return "border-red-300 bg-red-50 text-red-800";
}
