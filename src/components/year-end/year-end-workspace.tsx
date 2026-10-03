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
import { PackageExportPanel } from "@/components/year-end/package-export-panel";
import type { AccountantNote } from "@/db/schema";
import type { RentalProperty } from "@/lib/property-workspace";
import { toneSurface } from "@/lib/status-styles";
import { cn } from "@/lib/utils";
import type { ReadinessStatus } from "@/lib/year-end-readiness";
import { getFilingReadiness } from "@/lib/year-end-readiness-view-model";

export function YearEndWorkspace({
  properties,
  property,
  year,
  notes,
}: {
  properties: { id: string; name: string }[];
  property: RentalProperty;
  year: number;
  notes: AccountantNote[];
}) {
  const readiness = getFilingReadiness(property, year, "year-end");
  return (
    <section className="grid gap-4">
      <YearEndSelector
        properties={properties}
        selectedPropertyId={property.id}
        selectedYear={year}
      />
      <ReadinessPanel readiness={readiness} />
      <PackageExportPanel property={property} year={year} notes={notes} />
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

function ReadinessPanel({
  readiness,
}: {
  readiness: ReturnType<typeof getFilingReadiness>;
}) {
  const { rows, counts, yearEnd } = readiness;

  return (
    <Card className="rounded-md">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:justify-between">
        <div>
          <CardTitle as="h2">{yearEnd.propertyName}</CardTitle>
          <CardDescription>
            Blocking items should be resolved before export; warnings stay
            visible for review.
          </CardDescription>
        </div>
        <CardAction className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
          <ReadinessBadge status="blocking" count={counts.blocking} />
          <ReadinessBadge status="warning" count={counts.warning} />
          <ReadinessBadge status="clear" count={counts.clear} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <dl className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Metric
            label="Uncategorized"
            value={yearEnd.uncategorizedTransactions}
            position="first"
          />
          <Metric label="Missing receipts" value={yearEnd.missingReceipts} />
          <Metric
            label="Capital marked"
            value={yearEnd.capitalAssetTransactions}
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
