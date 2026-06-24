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
import { toneSurface } from "@/lib/status-styles";
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
  const selectedPropertyName =
    properties.find((property) => property.id === selectedPropertyId)?.name ??
    "Select property";

  return (
    <Card className="rounded-md">
      <CardHeader className="gap-3 lg:grid-cols-[1fr_auto]">
        <div>
          <CardTitle as="h1">Year-end readiness</CardTitle>
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
                <span className="flex flex-1 text-left">
                  {selectedPropertyName}
                </span>
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
          <CardTitle as="h2">{readiness.propertyName}</CardTitle>
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
        <dl className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Metric
            label="Uncategorized"
            value={readiness.uncategorizedTransactions}
            position="first"
          />
          <Metric label="Missing receipts" value={readiness.missingReceipts} />
          <Metric
            label="Capital marked"
            value={readiness.capitalAssetTransactions}
            position="last"
          />
        </dl>

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
      {count} {formatReadinessStatus(status)}
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
      {status === "clear"
        ? formatReadinessStatus(status)
        : `${count} ${formatReadinessStatus(status)}`}
    </Badge>
  );
}

function formatReadinessStatus(status: ReadinessStatus) {
  if (status === "clear") {
    return "Clear";
  }

  if (status === "warning") {
    return "Needs review";
  }

  return "Blocking";
}

function StatusIcon({ status }: { status: ReadinessStatus }) {
  if (status === "clear") {
    return <CheckCircle2 className="size-4 text-ready" />;
  }

  if (status === "warning") {
    return <CircleDot className="size-4 text-review" />;
  }

  return <AlertTriangle className="size-4 text-blocked" />;
}

function Metric({
  label,
  value,
  position,
}: {
  label: string;
  value: number;
  position?: "first" | "last";
}) {
  return (
    <div
      className={cn(
        "py-3 sm:px-5 sm:py-0",
        position === "first" && "pt-0 sm:pt-0 sm:pl-0",
        position === "last" && "pb-0 sm:pb-0 sm:pr-0",
      )}
    >
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 font-semibold text-2xl tabular-nums">{value}</dd>
    </div>
  );
}

function statusClassName(status: ReadinessStatus) {
  if (status === "clear") {
    return toneSurface.ready;
  }

  if (status === "warning") {
    return toneSurface.review;
  }

  return toneSurface.blocked;
}
