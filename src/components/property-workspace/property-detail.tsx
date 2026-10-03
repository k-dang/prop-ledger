"use client";

import {
  AlertTriangle,
  ArrowRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CircleDot,
  type LucideIcon,
  MapPin,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { MortgagePaymentsPanel } from "@/components/evidence-binder/allocation-controls";
import {
  DeductionsAndIncomePanel,
  EvidenceBinderPanel,
} from "@/components/evidence-binder/evidence-workspace";
import {
  RentActivityCard,
  RentActivityTools,
  RentIncomeSummaryStrip,
  RentLedgerDetail,
} from "@/components/rent-ledger/rent-ledger-detail";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  PropertyReadiness,
  RentalProperty,
} from "@/lib/property-workspace";
import { formatMoney, type RentLedger } from "@/lib/rent-ledger";
import {
  type StatusTone,
  toneChip,
  toneIcon,
  toneSurface,
} from "@/lib/status-styles";
import { summarizeTaxYearFinancials } from "@/lib/tax-year-financial-summary";
import { cn } from "@/lib/utils";
import type { FilingStatus, ReadinessStatus } from "@/lib/year-end-readiness";
import {
  getFilingReadiness,
  type YearEndReadinessRow,
} from "@/lib/year-end-readiness-view-model";
import { PropertySetup } from "./property-setup";

export function PropertyWorkspaceDetail({
  property,
  rentLedger,
  year,
}: {
  property: RentalProperty;
  rentLedger: RentLedger;
  year: number;
}) {
  const filingReadiness = getFilingReadiness(property, year, "property");
  const { setup: readiness, yearEnd: yearEndReadiness } = filingReadiness;
  const deferActivity = readiness.setupGapCount > 0;
  const openTaxActivity =
    !deferActivity &&
    (yearEndReadiness.uncategorizedTransactions > 0 ||
      yearEndReadiness.missingReceipts > 0);
  const mortgagePaymentSummary = getMortgagePaymentSummary(property, year);
  const taxableActivitySummary = getTaxableActivitySummary(
    property,
    rentLedger,
    year,
  );

  return (
    <>
      <section id="summary" className="grid scroll-mt-4 gap-4">
        <PropertySetupOverview
          property={property}
          readiness={readiness}
          year={year}
        >
          <FilingReadinessOverview
            property={property}
            rentLedger={rentLedger}
            taxYear={year}
            filingReadiness={filingReadiness}
          />
        </PropertySetupOverview>
      </section>
      <section id="setup" className="grid scroll-mt-4 gap-4">
        <PropertySetup property={property} readiness={readiness} />
      </section>
      <section id="rent" className="scroll-mt-4">
        <RentLedgerDetail
          ledger={rentLedger}
          year={year}
          showActivityTools={false}
          showActivityTable={false}
          defaultOpenLeases={false}
        />
      </section>
      <WorkflowDetails
        id="mortgage-payments"
        icon={WalletCards}
        summary={mortgagePaymentSummary}
        title="Mortgage payments"
        description={
          deferActivity
            ? "Available after setup, but secondary to the current readiness gap."
            : "Record deductible interest and supporting principal amounts."
        }
        open={false}
      >
        <MortgagePaymentsPanel
          propertyId={property.id}
          payments={property.mortgagePayments}
        />
      </WorkflowDetails>
      <WorkflowDetails
        id="tax-activity"
        icon={CircleDollarSign}
        summary={taxableActivitySummary}
        title="Record taxable activity"
        description={
          deferActivity
            ? "Rent, deductions, and income are available, but setup should be fixed first."
            : `Rent payments, deductions, and non-rent income for ${year}.`
        }
        open={openTaxActivity}
      >
        <div className="grid gap-3">
          <EvidenceBinderPanel property={property} />
          <RentIncomeSummaryStrip ledger={rentLedger} year={year} />
          <div className="grid items-stretch gap-4 xl:grid-cols-2">
            <RentActivityTools
              className="h-full"
              ledger={rentLedger}
              year={year}
              showActivity={false}
            />
            <DeductionsAndIncomePanel className="h-full" property={property} />
            <RentActivityCard
              ledger={rentLedger}
              year={year}
              variant="table"
              className="xl:col-span-2"
            />
          </div>
        </div>
      </WorkflowDetails>
    </>
  );
}

function WorkflowDetails({
  id,
  icon: Icon,
  summary,
  title,
  description,
  open,
  children,
}: {
  id: string;
  icon: LucideIcon;
  summary: string;
  title: string;
  description: string;
  open: boolean;
  children: ReactNode;
}) {
  // Freeze the uncontrolled Accordion's initial state; `open` is derived from
  // live readiness data and changes across re-renders.
  const [initialOpen] = useState(() => (open ? [id] : []));
  return (
    <section id={id} className="scroll-mt-4">
      <Card className="rounded-md py-0">
        <h2 className="sr-only">{title}</h2>
        <Accordion defaultValue={initialOpen}>
          <AccordionItem value={id} className="border-b-0">
            <AccordionTrigger className="items-center px-4 py-3 hover:no-underline">
              <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-2">
                <Icon
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <span className="block font-medium text-sm">{title}</span>
                  <span className="block truncate text-muted-foreground text-xs">
                    {description}
                  </span>
                </div>
                <span className="ml-auto hidden shrink-0 text-muted-foreground text-xs tabular-nums sm:inline">
                  {summary}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent
              id={`${id}-panel`}
              className="grid gap-4 border-t px-4 py-4"
            >
              {children}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </section>
  );
}

function FilingReadinessOverview({
  property,
  rentLedger,
  taxYear,
  filingReadiness,
}: {
  property: RentalProperty;
  rentLedger: RentLedger;
  taxYear: number;
  filingReadiness: ReturnType<typeof getFilingReadiness>;
}) {
  const { status, counts, rows, yearEnd: yearEndReadiness } = filingReadiness;
  const nextRow = rows.find((row) => row.status !== "clear");
  const tone = getOverallFilingTone(status);
  const StatusIcon = getOverallFilingIcon(status);
  const financials = summarizeTaxYearFinancials(
    { ...property, rentEvents: rentLedger.rentEvents },
    taxYear,
    yearEndReadiness.uncategorizedTransactions,
  );
  const metrics = [
    {
      label: "Gross rental income",
      value: formatMoney(financials.grossRentalIncome),
      icon: BanknoteArrowUp,
      accent: toneChip.ready,
    },
    {
      label: "Payments received",
      value: formatMoney(financials.paymentsReceived),
      icon: WalletCards,
      accent: toneChip.info,
    },
    {
      label: "Deductible expenses",
      value: formatMoney(financials.deductibleExpenses),
      icon: BanknoteArrowDown,
      accent: toneChip.review,
    },
    {
      label: "Net recorded income",
      value: formatMoney(financials.netRecordedRentalIncome),
      icon: CircleDollarSign,
      accent: "bg-brand-surface text-brand",
      incomplete: financials.incompleteTransactionCount > 0,
    },
  ];

  return (
    <section
      aria-labelledby="filing-readiness-title"
      className="grid min-w-0 content-start gap-4"
    >
      <div className={cn("rounded-md border p-3", toneSurface[tone])}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <StatusIcon
              className={cn("mt-0.5 size-4 shrink-0", toneIcon[tone])}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2
                id="filing-readiness-title"
                className="font-heading font-medium text-base text-foreground leading-snug"
              >
                Filing readiness for {taxYear}
              </h2>
              <p className="mt-1 text-sm">
                <span className="font-medium">
                  {formatOverallFilingStatus(status)}
                </span>
                <span aria-hidden="true"> · </span>
                <span>{formatFilingCheckSummary(counts, rows.length)}</span>
              </p>
              <p className="mt-1 max-w-2xl text-xs">
                {getFilingReadinessMessage(status, rows)}
              </p>
            </div>
          </div>
          {nextRow ? (
            <Link
              href={nextRow.href}
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "w-fit rounded-md",
              )}
            >
              {status === "blocked" ? "Review next item" : "Open review"}
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          ) : (
            <Link
              href={`/year-end?propertyId=${property.id}&year=${taxYear}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-fit rounded-md",
              )}
            >
              Open year-end
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>

      <ul
        className="divide-y overflow-hidden rounded-md border"
        aria-label={`Filing readiness checks for ${taxYear}`}
      >
        {rows.map((row) => (
          <FilingReadinessCheckRow key={row.id} row={row} />
        ))}
      </ul>

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-2">
        {metrics.map((metric) => (
          <FilingFinancialMetric key={metric.label} {...metric} />
        ))}
      </dl>
    </section>
  );
}

function FilingReadinessCheckRow({ row }: { row: YearEndReadinessRow }) {
  const tone = getReadinessTone(row.status);
  const StatusIcon = getReadinessIcon(row.status);

  return (
    <li className="grid gap-3 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center">
      <span
        className={cn(
          "grid size-8 place-items-center rounded-md",
          row.status === "clear" ? toneChip.ready : toneChip[tone],
        )}
      >
        <StatusIcon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-medium text-sm">{row.label}</p>
        <p className="text-muted-foreground text-xs">{row.detail}</p>
      </div>
      <ReadinessStatusBadge status={row.status} count={row.count} />
      <Link
        href={row.href}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "w-fit rounded-md",
        )}
      >
        {row.actionLabel}
      </Link>
    </li>
  );
}

function FilingFinancialMetric({
  label,
  value,
  icon: Icon,
  accent,
  incomplete,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: string;
  incomplete?: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-2 rounded-md border bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-3">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <span
          className={cn("grid size-7 place-items-center rounded-md", accent)}
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
      </div>
      <dd className="min-w-0 whitespace-nowrap font-semibold text-lg tabular-nums">
        {value}
      </dd>
      {incomplete ? (
        <Badge
          variant="outline"
          className={cn("w-fit rounded-md", toneSurface.review)}
        >
          Incomplete
        </Badge>
      ) : null}
    </div>
  );
}

function ReadinessStatusBadge({
  status,
  count,
}: {
  status: ReadinessStatus;
  count: number;
}) {
  const tone = getReadinessTone(status);
  const label =
    status === "clear"
      ? "Clear"
      : status === "blocking"
        ? `${count} blocking`
        : `${count} review`;

  return (
    <Badge variant="outline" className={cn("rounded-md", toneSurface[tone])}>
      {label}
    </Badge>
  );
}

function pluralize(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function getMortgagePaymentSummary(property: RentalProperty, year: number) {
  const yearPrefix = `${year}-`;
  const paymentCount = property.mortgagePayments.filter((payment) =>
    payment.date.startsWith(yearPrefix),
  ).length;

  return `${pluralize(paymentCount, "payment")} in ${year}`;
}

function getTaxableActivitySummary(
  property: RentalProperty,
  rentLedger: RentLedger,
  year: number,
) {
  const yearPrefix = `${year}-`;
  const rentPaymentCount = rentLedger.rentEvents.filter(
    (event) => event.type === "payment" && event.date.startsWith(yearPrefix),
  ).length;
  const transactionCount = property.ledgerEntries.filter((entry) =>
    entry.date.startsWith(yearPrefix),
  ).length;

  return `${pluralize(rentPaymentCount, "rent payment")} · ${pluralize(
    transactionCount,
    "transaction",
  )}`;
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function PropertySetupOverview({
  property,
  readiness,
  year,
  children,
}: {
  property: RentalProperty;
  readiness: PropertyReadiness;
  year: number;
  children: ReactNode;
}) {
  const setupGaps = readiness.tasks.filter(
    (task) => task.status !== "complete",
  );
  const nextSetupGap = setupGaps[0];
  const setupComplete = nextSetupGap === undefined;
  const readinessTone =
    nextSetupGap === undefined
      ? "ready"
      : getSetupTaskTone(nextSetupGap.status);
  const StatusIcon =
    nextSetupGap === undefined
      ? CheckCircle2
      : getSetupTaskIcon(nextSetupGap.status);
  const setupGapLabel = `${readiness.setupGapCount} setup gap${
    readiness.setupGapCount === 1 ? "" : "s"
  }`;
  const setupStatusLabel = setupComplete
    ? "Setup complete"
    : `${setupGapLabel}: ${nextSetupGap.label}`;
  const setupStatusDetail = setupComplete
    ? `${readiness.completedCount} of ${readiness.totalCount} setup items complete.`
    : nextSetupGap.detail;
  const setupAction =
    nextSetupGap === undefined ? null : getSetupAction(nextSetupGap.id);
  const setupFacts = [
    { label: "Units", value: property.units.length },
    { label: "Owners", value: property.owners.length },
    { label: "Ownership periods", value: property.ownershipPeriods.length },
  ];

  return (
    <Card className="rounded-md">
      <CardHeader className="pb-3">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <CardTitle as="h1" className="truncate text-xl">
              {property.name}
            </CardTitle>
            <CardDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" />
                {property.line1}, {property.municipality}, {property.province}{" "}
                {property.postalCode}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                Acquired {formatDisplayDate(property.acquisitionDate)}
              </span>
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <div className="flex items-center gap-1 rounded-md border bg-background p-1">
              <span className="sr-only">Tax year</span>
              <Link
                href={`/properties/${property.id}?year=${year - 1}`}
                aria-label={`View ${year - 1}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "size-7 rounded-sm",
                )}
              >
                <ChevronLeft aria-hidden="true" />
              </Link>
              <span className="px-2 font-medium text-sm tabular-nums">
                {year}
              </span>
              <Link
                href={`/properties/${property.id}?year=${year + 1}`}
                aria-label={`View ${year + 1}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "size-7 rounded-sm",
                )}
              >
                <ChevronRight aria-hidden="true" />
              </Link>
            </div>
            <Badge
              variant="outline"
              className={cn("rounded-md", toneSurface[readinessTone])}
            >
              {setupGapLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="border-t p-0">
        <div className="grid lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]">
          <section
            aria-labelledby="property-setup-overview-title"
            className="grid content-start gap-3 p-4 lg:border-r"
          >
            <div className="min-w-0">
              <h2
                id="property-setup-overview-title"
                className="font-heading font-medium text-base leading-snug"
              >
                Property setup
              </h2>
              <p className="text-muted-foreground text-sm">
                Ownership and unit records required before filing.
              </p>
            </div>
            <div
              className={cn(
                "grid gap-3 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:grid-cols-1",
                toneSurface[readinessTone],
              )}
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <StatusIcon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    toneIcon[readinessTone],
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-medium text-sm">{setupStatusLabel}</p>
                  <p className="text-xs">{setupStatusDetail}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="justify-self-start rounded-md bg-background/70 text-xs tabular-nums sm:justify-self-end lg:justify-self-start"
              >
                {readiness.completedCount}/{readiness.totalCount} complete
              </Badge>
              {setupAction ? (
                <Link
                  href={setupAction.href}
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "justify-self-start rounded-md",
                  )}
                >
                  {setupAction.label}
                </Link>
              ) : null}
            </div>
            <dl className="grid overflow-hidden rounded-md border sm:grid-cols-3 sm:divide-x lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
              {setupFacts.map((fact) => (
                <div
                  className="flex items-center justify-between gap-3 px-3 py-2"
                  key={fact.label}
                >
                  <dt className="text-muted-foreground text-xs">
                    {fact.label}
                  </dt>
                  <dd className="font-semibold text-sm tabular-nums">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <div className="min-w-0 border-t p-4 lg:border-t-0">{children}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function getOverallFilingTone(status: FilingStatus): StatusTone {
  if (status === "ready") {
    return "ready";
  }

  if (status === "needs_review") {
    return "review";
  }

  return "blocked";
}

function getOverallFilingIcon(status: FilingStatus) {
  if (status === "ready") {
    return CheckCircle2;
  }

  if (status === "needs_review") {
    return CircleDot;
  }

  return AlertTriangle;
}

function getReadinessTone(status: ReadinessStatus): StatusTone {
  if (status === "clear") {
    return "ready";
  }

  if (status === "warning") {
    return "review";
  }

  return "blocked";
}

function getReadinessIcon(status: ReadinessStatus) {
  if (status === "clear") {
    return CheckCircle2;
  }

  if (status === "warning") {
    return CircleDot;
  }

  return AlertTriangle;
}

function formatFilingCheckSummary(
  counts: ReturnType<typeof getFilingReadiness>["counts"],
  total: number,
) {
  const unresolved = [
    counts.blocking > 0 ? `${counts.blocking} blocking` : null,
    counts.warning > 0 ? `${counts.warning} review` : null,
  ].filter((item): item is string => item !== null);
  const clearSummary = `${counts.clear} of ${total} checks clear`;

  return unresolved.length > 0
    ? `${clearSummary} · ${unresolved.join(" · ")}`
    : clearSummary;
}

function formatOverallFilingStatus(status: FilingStatus) {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "needs_review") {
    return "Needs review";
  }

  return "Blocked";
}

function getFilingReadinessMessage(
  status: FilingStatus,
  rows: YearEndReadinessRow[],
) {
  if (status === "ready") {
    return "Records are ready for year-end export.";
  }

  const activeRows = rows.filter((row) =>
    status === "blocked" ? row.status === "blocking" : row.status === "warning",
  );
  const reason = formatReadableList(activeRows.map((row) => row.label));

  if (status === "blocked") {
    return `Blocked by ${reason}. Resolve blocking items before export.`;
  }

  return `Review ${reason} before export.`;
}

function formatReadableList(items: string[]) {
  if (items.length === 0) {
    return "remaining checks";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function getSetupAction(id: PropertyReadiness["tasks"][number]["id"]) {
  if (id === "units") {
    return { href: "#units", label: "Add unit" };
  }

  if (id === "owners" || id === "ownership") {
    return { href: "#ownership-history", label: "Fix ownership shares" };
  }

  return { href: "#property-setup", label: "Review setup" };
}

function getSetupTaskTone(
  status: PropertyReadiness["tasks"][number]["status"],
) {
  if (status === "complete") {
    return "ready";
  }

  if (status === "warning") {
    return "blocked";
  }

  return "review";
}

function getSetupTaskIcon(
  status: PropertyReadiness["tasks"][number]["status"],
) {
  if (status === "complete") {
    return CheckCircle2;
  }

  if (status === "warning") {
    return AlertTriangle;
  }

  return CircleDot;
}
