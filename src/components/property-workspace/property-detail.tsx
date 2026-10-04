"use client";

import {
  AlertTriangle,
  ArrowRight,
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
  RentLedgerDetail,
  RentPaymentPanel,
} from "@/components/rent-ledger/rent-ledger-detail";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  today,
}: {
  property: RentalProperty;
  rentLedger: RentLedger;
  year: number;
  today: string;
}) {
  const filingReadiness = getFilingReadiness(property, year, "property");
  const { setup: readiness, yearEnd: yearEndReadiness } = filingReadiness;
  const deferActivity = readiness.setupGapCount > 0;
  const openTaxActivity =
    !deferActivity &&
    (yearEndReadiness.uncategorizedTransactions > 0 ||
      yearEndReadiness.missingReceipts > 0);
  const mortgagePaymentSummary = getMortgagePaymentSummary(property, year);
  const taxableActivitySummary = getTaxableActivitySummary(property, year);

  return (
    <>
      <section id="summary" className="grid scroll-mt-4 gap-4">
        <PropertyWorkspaceHeader
          property={property}
          readiness={readiness}
          year={year}
        />
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <RentPaymentPanel
            key={`${property.id}-${year}-${rentLedger.leases.map((lease) => lease.id).join("-")}`}
            ledger={rentLedger}
            year={year}
            today={today}
            className="lg:col-start-2 lg:row-start-1"
          />
          <PropertyFinancialSummary
            property={property}
            rentLedger={rentLedger}
            taxYear={year}
            uncategorizedTransactions={
              yearEndReadiness.uncategorizedTransactions
            }
            className="lg:col-start-1 lg:row-start-1"
          />
        </div>
      </section>
      <FilingReadinessOverview
        property={property}
        taxYear={year}
        filingReadiness={filingReadiness}
      />
      <section id="setup" className="grid scroll-mt-4 gap-4">
        <PropertySetup property={property} readiness={readiness} />
      </section>
      <section id="rent" className="scroll-mt-4">
        <RentLedgerDetail
          ledger={rentLedger}
          year={year}
          today={today}
          showActivityTools={false}
          showActivityTable={false}
          defaultOpenLeases={rentLedger.leases.length === 0}
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
        title="Expenses & non-rent income"
        description={
          deferActivity
            ? "Deductions and non-rent income are available, but setup should be fixed first."
            : `Deductions and non-rent income for ${year}.`
        }
        open={openTaxActivity}
      >
        <div className="grid gap-3">
          <EvidenceBinderPanel property={property} />
          <DeductionsAndIncomePanel property={property} />
        </div>
      </WorkflowDetails>
      <RentActivityCard ledger={rentLedger} year={year} variant="table" />
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
  taxYear,
  filingReadiness,
}: {
  property: RentalProperty;
  taxYear: number;
  filingReadiness: ReturnType<typeof getFilingReadiness>;
}) {
  const { status, counts, rows } = filingReadiness;
  const nextRow = rows.find((row) => row.status !== "clear");
  const tone = getOverallFilingTone(status);
  const StatusIcon = getOverallFilingIcon(status);

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

function PropertyFinancialSummary({
  property,
  rentLedger,
  taxYear,
  uncategorizedTransactions,
  className,
}: {
  property: RentalProperty;
  rentLedger: RentLedger;
  taxYear: number;
  uncategorizedTransactions: number;
  className?: string;
}) {
  const financials = summarizeTaxYearFinancials(
    { ...property, rentEvents: rentLedger.rentEvents },
    taxYear,
    uncategorizedTransactions,
  );
  const figures = [
    { label: "Rent received", amount: financials.paymentsReceived },
    { label: "Gross rental income", amount: financials.grossRentalIncome },
    { label: "Deductible expenses", amount: financials.deductibleExpenses },
    {
      label: "Net recorded income",
      amount: financials.netRecordedRentalIncome,
      incomplete: financials.incompleteTransactionCount > 0,
    },
  ];
  return (
    <section
      aria-label={`Financial summary for ${taxYear}`}
      className={cn("overflow-hidden rounded-xl border bg-card", className)}
    >
      <dl className="divide-y">
        {figures.map((figure) => (
          <div key={figure.label} className="px-5 py-4">
            <dt className="text-sm text-muted-foreground">{figure.label}</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight tabular-nums">
              {formatMoney(figure.amount)}
              {figure.incomplete && (
                <Badge variant="outline" className={toneSurface.review}>
                  Incomplete
                </Badge>
              )}
            </dd>
            <dd className="mt-1 text-xs text-muted-foreground">
              {taxYear} · Recorded amounts
            </dd>
          </div>
        ))}
      </dl>
    </section>
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

function getTaxableActivitySummary(property: RentalProperty, year: number) {
  const count = property.ledgerEntries.filter((entry) =>
    entry.date.startsWith(`${year}-`),
  ).length;
  return `${pluralize(count, "transaction")} in ${year}`;
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

function PropertyWorkspaceHeader({
  property,
  readiness,
  year,
}: {
  property: RentalProperty;
  readiness: PropertyReadiness;
  year: number;
}) {
  const nextSetupGap = readiness.tasks.find(
    (task) => task.status !== "complete",
  );
  const tone = nextSetupGap ? getSetupTaskTone(nextSetupGap.status) : "ready";
  return (
    <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-semibold text-2xl tracking-tight">
          {property.name}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-sm">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden="true" />
            {property.line1}, {property.municipality}, {property.province}{" "}
            {property.postalCode}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Acquired {formatDisplayDate(property.acquisitionDate)}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border bg-background p-1">
          <span className="sr-only">Tax year</span>
          <Link
            href={`/properties/${property.id}?year=${year - 1}`}
            aria-label={`View ${year - 1}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "min-h-11 min-w-11",
            )}
          >
            <ChevronLeft aria-hidden="true" />
          </Link>
          <span className="px-2 font-medium text-sm tabular-nums">{year}</span>
          <Link
            href={`/properties/${property.id}?year=${year + 1}`}
            aria-label={`View ${year + 1}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "min-h-11 min-w-11",
            )}
          >
            <ChevronRight aria-hidden="true" />
          </Link>
        </div>
        <Badge
          variant="outline"
          className={cn("rounded-md", toneSurface[tone])}
        >
          {nextSetupGap
            ? `${readiness.setupGapCount} setup gap${readiness.setupGapCount === 1 ? "" : "s"}`
            : "Setup complete"}
        </Badge>
      </div>
    </header>
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
