import {
  AlertTriangle,
  ArrowRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Landmark,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { AddPropertySheet } from "@/components/property-workspace/add-property-sheet";
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
import type {
  DashboardAttentionItem,
  FinancialSummary,
  PortfolioDashboardSummary,
  PropertyDashboardStatus,
} from "@/lib/portfolio-dashboard";
import { formatMoney } from "@/lib/rent-ledger";
import { cn } from "@/lib/utils";

export function Dashboard({ summary }: { summary: PortfolioDashboardSummary }) {
  return (
    <section className="grid gap-6">
      <DashboardHeader summary={summary} />
      {summary.properties.length === 0 ? (
        <EmptyPortfolio />
      ) : (
        <>
          <FinancialKpis totals={summary.totals} taxYear={summary.taxYear} />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
            <AttentionPanel summary={summary} />
            <ExpenseBreakdown summary={summary} />
          </div>
          <PropertyComparison summary={summary} />
        </>
      )}
    </section>
  );
}

function DashboardHeader({ summary }: { summary: PortfolioDashboardSummary }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-indigo-100 text-indigo-700">
            <Landmark className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">
              Portfolio dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Financial activity and record-readiness across every property.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        {summary.properties.length > 0 ? (
          <form className="flex items-end gap-2">
            <Field className="gap-1">
              <FieldLabel htmlFor="dashboard-year">Tax year</FieldLabel>
              <Select name="year" defaultValue={String(summary.taxYear)}>
                <SelectTrigger
                  id="dashboard-year"
                  className="w-28 bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {summary.availableTaxYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
        ) : null}
        <AddPropertySheet />
      </div>
    </div>
  );
}

function EmptyPortfolio() {
  return (
    <Card className="border-dashed bg-background/60 py-16 text-center">
      <CardContent className="mx-auto grid max-w-md justify-items-center gap-3">
        <span className="grid size-12 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
          <Building2 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold text-lg">Add your first property</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Portfolio totals and readiness checks will appear here once a
            property workspace exists.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialKpis({
  totals,
  taxYear,
}: {
  totals: FinancialSummary;
  taxYear: number;
}) {
  const incomplete = totals.incompleteTransactionCount;
  const cards = [
    {
      label: "Gross rental income",
      value: totals.grossRentalIncome,
      hint: "Income earned on an accrual basis",
      icon: BanknoteArrowUp,
      accent: "bg-emerald-50 text-emerald-700",
      // Uncategorized entries can be recorded income, so gross income is as
      // provisional as the expense and net figures when any remain.
      incomplete: incomplete > 0,
    },
    {
      label: "Payments received",
      value: totals.paymentsReceived,
      hint: "Rent cash received",
      icon: WalletCards,
      accent: "bg-sky-50 text-sky-700",
      incomplete: false,
    },
    {
      label: "Deductible expenses",
      value: totals.deductibleExpenses,
      hint: "Categorized T776 current expenses",
      icon: BanknoteArrowDown,
      accent: "bg-amber-50 text-amber-700",
      incomplete: incomplete > 0,
    },
    {
      label: "Net recorded rental income",
      value: totals.netRecordedRentalIncome,
      hint: "Recorded income less deductible expenses",
      icon: CircleDollarSign,
      accent: "bg-indigo-50 text-indigo-700",
      incomplete: incomplete > 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card className="gap-4 bg-background py-5" key={card.label}>
            <CardHeader className="grid grid-cols-[1fr_auto] items-start px-5">
              <div className="min-w-0">
                <CardDescription className="font-medium text-xs uppercase tracking-wide">
                  {card.label}
                </CardDescription>
                <CardTitle className="mt-2 font-semibold text-2xl tabular-nums tracking-tight">
                  {formatMoney(card.value)}
                </CardTitle>
              </div>
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-lg",
                  card.accent,
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent className="border-t px-5 pt-4 text-muted-foreground text-xs">
              <div className="flex items-center justify-between gap-3">
                <span>{card.hint}</span>
                {card.incomplete ? (
                  <Badge
                    className="border-amber-300 bg-amber-50 text-amber-800"
                    variant="outline"
                  >
                    Incomplete
                  </Badge>
                ) : (
                  <span className="shrink-0 tabular-nums">{taxYear}</span>
                )}
              </div>
              {card.incomplete ? (
                <p className="mt-2 text-amber-800">
                  Review {incomplete} uncategorized transaction
                  {incomplete === 1 ? "" : "s"}; totals may change.
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function AttentionPanel({ summary }: { summary: PortfolioDashboardSummary }) {
  const blocking = summary.attentionItems.filter(
    (item) => item.severity === "blocking",
  ).length;
  const warnings = summary.attentionItems.length - blocking;

  return (
    <Card className="bg-background">
      <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Needs attention</CardTitle>
          <CardDescription>
            Portfolio-wide work ordered by filing impact.
          </CardDescription>
        </div>
        <CardAction className="flex gap-2">
          <Badge variant="outline" className={statusClassName("blocked")}>
            {blocking} blocking
          </Badge>
          <Badge variant="outline" className={statusClassName("needs_review")}>
            {warnings} review
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {summary.attentionItems.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium text-sm">No open portfolio issues</p>
              <p className="text-emerald-800 text-xs">
                All active properties are ready for {summary.taxYear}.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-h-96 divide-y overflow-y-auto pr-1">
            {summary.attentionItems.map((item) => (
              <AttentionRow item={item} key={item.id} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AttentionRow({ item }: { item: DashboardAttentionItem }) {
  const blocking = item.severity === "blocking";

  return (
    <div className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <span
        className={cn(
          "grid size-8 place-items-center rounded-full",
          blocking ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700",
        )}
      >
        {blocking ? (
          <AlertTriangle className="size-4" aria-hidden="true" />
        ) : (
          <ClipboardCheck className="size-4" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-sm">{item.label}</p>
          <Badge variant="outline" className="rounded-md">
            {item.count}
          </Badge>
        </div>
        <p className="truncate text-muted-foreground text-xs">
          {item.propertyName} · {item.detail}
        </p>
      </div>
      <Link
        href={item.href}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "w-fit",
        )}
      >
        Review
        <ArrowRight data-icon="inline-end" aria-hidden="true" />
      </Link>
    </div>
  );
}

function ExpenseBreakdown({ summary }: { summary: PortfolioDashboardSummary }) {
  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>Expenses by T776 category</CardTitle>
        <CardDescription>
          Deductible expenses recorded for {summary.taxYear}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {summary.expenseCategories.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-muted-foreground text-sm">
            No categorized expenses recorded for this Tax Year.
          </div>
        ) : (
          <div className="grid gap-4">
            {summary.expenseCategories.map((category) => (
              <Link
                href={`/transactions?year=${summary.taxYear}&category=${category.category}`}
                className="group grid gap-1.5"
                key={category.category}
              >
                <span className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate group-hover:underline">
                    {category.label}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatMoney(category.amount)}
                  </span>
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-indigo-600 transition-colors group-hover:bg-indigo-700"
                    style={{ width: `${category.percentage}%` }}
                  />
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {category.percentage}% of recorded deductible expenses
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PropertyComparison({
  summary,
}: {
  summary: PortfolioDashboardSummary;
}) {
  return (
    <Card className="bg-background">
      <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Property comparison</CardTitle>
          <CardDescription>
            Recorded financials and Year-End Readiness for {summary.taxYear}.
          </CardDescription>
        </div>
        <CardAction className="flex flex-wrap gap-2">
          <Badge variant="outline" className={statusClassName("ready")}>
            {summary.readinessCounts.ready} ready
          </Badge>
          <Badge variant="outline" className={statusClassName("needs_review")}>
            {summary.readinessCounts.needs_review} review
          </Badge>
          <Badge variant="outline" className={statusClassName("blocked")}>
            {summary.readinessCounts.blocked} blocked
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Gross income</TableHead>
              <TableHead className="text-right">Payments</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Net recorded</TableHead>
              <TableHead className="text-right">Exceptions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.properties.map((property) => {
              const inactive = property.status === "not_active";

              return (
                <TableRow
                  className="relative transition-colors hover:bg-muted/40"
                  key={property.propertyId}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/properties/${property.propertyId}`}
                      className="after:absolute after:inset-0 hover:underline"
                    >
                      {property.propertyName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={property.status}
                      taxYear={summary.taxYear}
                    />
                  </TableCell>
                  <MoneyCell
                    value={property.grossRentalIncome}
                    inactive={inactive}
                  />
                  <MoneyCell
                    value={property.paymentsReceived}
                    inactive={inactive}
                  />
                  <MoneyCell
                    value={property.deductibleExpenses}
                    inactive={inactive}
                  />
                  <MoneyCell
                    value={property.netRecordedRentalIncome}
                    inactive={inactive}
                  />
                  <TableCell className="text-right tabular-nums">
                    {inactive ? "—" : property.openExceptionCount}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function MoneyCell({ value, inactive }: { value: number; inactive: boolean }) {
  return (
    <TableCell className="text-right tabular-nums">
      {inactive ? "—" : formatMoney(value)}
    </TableCell>
  );
}

function StatusBadge({
  status,
  taxYear,
}: {
  status: PropertyDashboardStatus;
  taxYear: number;
}) {
  const label =
    status === "ready"
      ? "Ready"
      : status === "needs_review"
        ? "Needs review"
        : status === "blocked"
          ? "Blocked"
          : `Not active in ${taxYear}`;

  return (
    <Badge variant="outline" className={statusClassName(status)}>
      {label}
    </Badge>
  );
}

function statusClassName(status: PropertyDashboardStatus) {
  if (status === "ready") {
    return "rounded-md border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (status === "needs_review") {
    return "rounded-md border-amber-300 bg-amber-50 text-amber-800";
  }

  if (status === "blocked") {
    return "rounded-md border-red-300 bg-red-50 text-red-800";
  }

  return "rounded-md border-slate-300 bg-slate-50 text-slate-700";
}
