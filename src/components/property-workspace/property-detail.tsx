"use client";

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MortgagePaymentsPanel } from "@/components/evidence-binder/allocation-controls";
import {
  DeductionsAndIncomePanel,
  EvidenceBinderPanel,
} from "@/components/evidence-binder/evidence-workspace";
import { FinishSetupCard } from "@/components/property-setup/finish-setup-card";
import {
  RentActivityCard,
  RentLedgerDetail,
  RentPaymentPanel,
} from "@/components/rent-ledger/rent-ledger-detail";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatDateWithYear,
  type PropertyReadiness,
  type RentalProperty,
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

type PropertyTab = "rent" | "expenses" | "mortgage" | "setup";

/**
 * In-page anchors used elsewhere in the workspace (readiness rows, "Add
 * lease"/"Add unit" buttons) that now resolve to a tab. Selecting the tab is
 * not enough on its own: the target element only mounts once its panel is
 * active, so the effect below re-scrolls after the switch.
 */
const TAB_FOR_ANCHOR: Record<string, PropertyTab> = {
  "#rent": "rent",
  "#leases": "rent",
  "#transactions": "expenses",
  "#tax-activity": "expenses",
  "#mortgage-payments": "mortgage",
  "#units": "setup",
  "#ownership-history": "setup",
  "#property-setup": "setup",
};

/**
 * The target element can take more than one frame to mount: the tab panel
 * lands on one render and the Setup accordion expands on the next. Keep
 * looking for a bounded number of frames rather than scrolling once into
 * nothing.
 */
function scrollToTarget(id: string, attemptsLeft = 20) {
  const target = document.getElementById(id);

  if (target) {
    target.scrollIntoView();
    return;
  }

  if (attemptsLeft > 0) {
    requestAnimationFrame(() => scrollToTarget(id, attemptsLeft - 1));
  }
}

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

  // Tabs that are actually rendered; the setup tab is absent while guided
  // setup is unfinished (setup lives on its own page then).
  const availableTabs = useMemo<PropertyTab[]>(() => {
    const tabs: PropertyTab[] = ["rent", "expenses", "mortgage"];
    if (!property.setupDraft) {
      tabs.push("setup");
    }
    return tabs;
  }, [property.setupDraft]);

  // Open on whatever needs attention first, else rent (the primary action).
  const [activeTab, setActiveTab] = useState<PropertyTab>(() =>
    openTaxActivity ? "expenses" : "rent",
  );

  // Honour a deep link (initial hash or a later `#anchor` click) by opening
  // the tab that owns it, then scrolling to the now-mounted target.
  useEffect(() => {
    const syncFromHash = () => {
      const target = TAB_FOR_ANCHOR[window.location.hash];
      if (!target || !availableTabs.includes(target)) {
        return;
      }
      setActiveTab(target);
      const id = window.location.hash.slice(1);
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView();
      });
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [availableTabs]);

  return (
    <>
      <section
        id="summary"
        aria-label={`Property summary for ${year}`}
        className="grid scroll-mt-4 gap-4"
      >
        <PropertyWorkspaceHeader
          property={property}
          readiness={readiness}
          year={year}
        />
        {property.setupDraft ? (
          <FinishSetupCard property={property} today={today} />
        ) : null}
        <PropertySummaryBand
          property={property}
          rentLedger={rentLedger}
          taxYear={year}
          filingReadiness={filingReadiness}
        />
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as PropertyTab)}
        className="w-full"
      >
        <TabsList variant="line" className="w-full justify-start border-b">
          <TabsTrigger value="rent">Rent</TabsTrigger>
          <TabsTrigger value="expenses">Expenses &amp; income</TabsTrigger>
          <TabsTrigger value="mortgage">Mortgage</TabsTrigger>
          {property.setupDraft ? null : (
            <TabsTrigger value="setup">Setup</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="rent" id="rent" className="mt-4">
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <RentLedgerDetail
              ledger={rentLedger}
              year={year}
              today={today}
              showActivityTools={false}
              showActivityTable={false}
              defaultOpenLeases={rentLedger.leases.length === 0}
            />
            <RentPaymentPanel
              key={`${property.id}-${year}-${rentLedger.leases.map((lease) => lease.id).join("-")}`}
              ledger={rentLedger}
              year={year}
              today={today}
            />
          </div>
          <div className="mt-4">
            <RentActivityCard ledger={rentLedger} year={year} variant="table" />
          </div>
        </TabsContent>

        <TabsContent value="expenses" id="tax-activity" className="mt-4">
          <div className="grid gap-4">
            <EvidenceBinderPanel property={property} />
            <DeductionsAndIncomePanel property={property} />
          </div>
        </TabsContent>

        <TabsContent value="mortgage" id="mortgage-payments" className="mt-4">
          <MortgagePaymentsPanel
            propertyId={property.id}
            payments={property.mortgagePayments}
          />
        </TabsContent>

        {property.setupDraft ? null : (
          <TabsContent value="setup" className="mt-4">
            <PropertySetup property={property} readiness={readiness} />
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}

/**
 * One band that answers the two questions a landlord opens this page with:
 * "am I ready to file?" and "what are the numbers?" Readiness sits on a calm
 * status tint above the tab row; the four T776 figures sit below it.
 */
function PropertySummaryBand({
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
  const { status, counts, rows } = filingReadiness;
  const nextRow = rows.find((row) => row.status !== "clear");
  const tone = getOverallFilingTone(status);
  const StatusIcon = getOverallFilingIcon(status);
  const financials = summarizeTaxYearFinancials(
    { ...property, rentEvents: rentLedger.rentEvents },
    taxYear,
    filingReadiness.yearEnd.uncategorizedTransactions,
  );

  return (
    <div className="grid content-start gap-3">
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 px-4 py-3",
            toneSurface[tone],
          )}
        >
          <StatusIcon
            className={cn("size-4 shrink-0", toneIcon[tone])}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="font-medium text-sm">
              {formatOverallFilingStatus(status)} for {taxYear}
            </h2>
            <p className="text-xs">
              {formatFilingCheckSummary(counts, rows.length)}
            </p>
          </div>
          {nextRow ? (
            <Link
              href={nextRow.href}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "ml-auto w-fit rounded-md",
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
                "ml-auto w-fit rounded-md",
              )}
            >
              Open year-end
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
          <FinancialFigure
            label="Rent received"
            amount={financials.paymentsReceived}
          />
          <FinancialFigure
            label="Gross rental income"
            amount={financials.grossRentalIncome}
          />
          <FinancialFigure
            label="Deductible expenses"
            amount={financials.deductibleExpenses}
          />
          <FinancialFigure
            label="Net recorded income"
            amount={financials.netRecordedRentalIncome}
            incomplete={financials.incompleteTransactionCount > 0}
          />
        </dl>
      </div>

      {rows.some((row) => row.status !== "clear") ? (
        <ul
          className="divide-y overflow-hidden rounded-xl ring-1 ring-foreground/10"
          aria-label={`Filing readiness checks for ${taxYear}`}
        >
          {rows
            .filter((row) => row.status !== "clear")
            .map((row) => (
              <FilingReadinessCheckRow key={row.id} row={row} />
            ))}
        </ul>
      ) : null}
    </div>
  );
}

function FinancialFigure({
  label,
  amount,
  incomplete,
}: {
  label: string;
  amount: number;
  incomplete?: boolean;
}) {
  return (
    <div className="bg-card px-5 py-4">
      <dt className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-1 flex flex-wrap items-center gap-2 font-semibold text-xl tabular-nums tracking-tight">
        {formatMoney(amount)}
        {incomplete ? (
          <Badge
            variant="outline"
            className={cn("rounded-md", toneSurface.review)}
          >
            Incomplete
          </Badge>
        ) : null}
      </dd>
    </div>
  );
}

function FilingReadinessCheckRow({ row }: { row: YearEndReadinessRow }) {
  const tone = getReadinessTone(row.status);
  const StatusIcon = getReadinessIcon(row.status);

  return (
    <li
      className={cn(
        "grid gap-3 bg-card p-3 sm:items-center",
        row.actionLabel
          ? "sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
          : "sm:grid-cols-[auto_minmax(0,1fr)_auto]",
      )}
    >
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
      {row.actionLabel ? (
        <Link
          href={row.href}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-fit rounded-md",
          )}
        >
          {row.actionLabel}
        </Link>
      ) : null}
    </li>
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
            Acquired {formatDateWithYear(property.acquisitionDate)}
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
          {property.setupDraft
            ? "Setup in progress"
            : nextSetupGap
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
