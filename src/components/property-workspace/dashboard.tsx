import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Plus,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { TaxYearSelect } from "@/components/property-workspace/tax-year-select";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  PortfolioDashboardSummary,
  PropertyDashboardStatus,
} from "@/lib/portfolio-dashboard";
import { formatMoney } from "@/lib/rent-ledger";
import { toneChip, toneSurface } from "@/lib/status-styles";
import { cn } from "@/lib/utils";

/**
 * Portfolio dashboard, readiness first: answers "am I ready to file?" with a
 * single next step, then keeps financials and expense categories in
 * collapsible sections so the page stays calm on load.
 */
export function Dashboard({ summary }: { summary: PortfolioDashboardSummary }) {
  return (
    <section className="grid gap-6">
      <DashboardHeader summary={summary} />
      {summary.properties.length === 0 ? (
        <EmptyPortfolio />
      ) : (
        <>
          <ReadinessOverview summary={summary} />
          <FinancialsSection summary={summary} />
          <ExpensesSection summary={summary} />
        </>
      )}
    </section>
  );
}

function DashboardHeader({ summary }: { summary: PortfolioDashboardSummary }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground text-sm">
          <span className="tabular-nums">{summary.taxYear}</span> tax year
        </p>
      </div>
      <div className="flex items-center gap-2">
        {summary.properties.length > 0 ? (
          <TaxYearSelect
            taxYear={summary.taxYear}
            years={summary.availableTaxYears}
          />
        ) : null}
        <Link href="/properties/new" className={buttonVariants()}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add property
        </Link>
      </div>
    </div>
  );
}

function EmptyPortfolio() {
  return (
    <Card className="border-dashed bg-background/60 py-16 text-center">
      <CardContent className="mx-auto grid max-w-md justify-items-center gap-3">
        <span className="grid size-12 place-items-center rounded-xl bg-brand-surface text-brand">
          <Building2 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold text-lg">Add your first property</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Filing readiness and portfolio totals will appear here once a
            property workspace exists.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ReadinessOverview({
  summary,
}: {
  summary: PortfolioDashboardSummary;
}) {
  const active = summary.properties.filter(
    (property) => property.status !== "not_active",
  );
  const [nextStep, ...remaining] = summary.attentionItems;
  const blocking = summary.attentionItems.filter(
    (item) => item.severity === "blocking",
  ).length;

  if (active.length === 0) {
    return (
      <Card className="bg-background px-6 py-5">
        <p className="text-muted-foreground text-sm">
          No properties were active in {summary.taxYear}.
        </p>
      </Card>
    );
  }

  return (
    <Card className="gap-5 bg-background px-6 py-6">
      <div>
        <h2 className="font-semibold text-xl tracking-tight">
          <span className="tabular-nums">
            {summary.readinessCounts.ready} of {active.length}
          </span>{" "}
          {active.length === 1 ? "property" : "properties"} ready to file
        </h2>
        <p className="mt-0.5 text-muted-foreground text-sm tabular-nums">
          {nextStep
            ? `${plural(summary.attentionItems.length, "open item")} · ${blocking} blocking`
            : "No open items"}
        </p>
      </div>
      <ul
        className="flex gap-1"
        aria-label={`Readiness by property: ${summary.readinessCounts.ready} ready, ${summary.readinessCounts.needs_review} need review, ${summary.readinessCounts.blocked} blocked`}
      >
        {active.map((property) => (
          <li
            className={cn(
              "h-1.5 flex-1 rounded-full",
              progressClassName(property.status),
            )}
            key={property.propertyId}
            title={`${property.propertyName}: ${statusLabel(property.status, summary.taxYear)}`}
          />
        ))}
      </ul>
      {nextStep ? (
        <>
          <NextStep item={nextStep} />
          {remaining.length > 0 ? (
            <Collapsible>
              <CollapsibleTrigger className="group flex items-center gap-1 rounded-md text-muted-foreground text-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
                <ChevronRight
                  className="size-4 transition-transform group-data-panel-open:rotate-90"
                  aria-hidden="true"
                />
                {plural(remaining.length, "more item")}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 divide-y border-t">
                  {remaining.map((item) => (
                    <AttentionRow item={item} key={item.id} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </>
      ) : (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4",
            toneSurface.ready,
          )}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
            <p className="font-medium text-sm">
              Every active property is ready for {summary.taxYear}.
            </p>
          </div>
          <Link
            href={`/year-end?year=${summary.taxYear}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Go to year-end
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
      )}
    </Card>
  );
}

/** The single highest-impact attention item, promoted to a call to action. */
function NextStep({ item }: { item: DashboardAttentionItem }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-brand-surface px-5 py-4">
      <div className="min-w-0">
        <p className="font-medium text-brand-text text-xs uppercase tracking-wide">
          Next step
        </p>
        <p className="mt-1 font-medium">
          {item.label} · {item.propertyName}
        </p>
        <p className="text-muted-foreground text-sm">{item.detail}</p>
      </div>
      <Link
        href={item.href}
        className={cn(
          buttonVariants(),
          "bg-brand text-brand-foreground hover:bg-brand-hover",
        )}
      >
        Start
        <ArrowRight data-icon="inline-end" aria-hidden="true" />
      </Link>
    </div>
  );
}

function AttentionRow({ item }: { item: DashboardAttentionItem }) {
  const blocking = item.severity === "blocking";
  const Icon = blocking ? AlertTriangle : ClipboardCheck;

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 last:pb-0">
      <span
        className={cn(
          "grid size-7 place-items-center rounded-full",
          blocking ? toneChip.blocked : toneChip.review,
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        <span className="sr-only">{blocking ? "Blocking" : "Review"}</span>
      </span>
      <div className="min-w-0">
        <p className="font-medium text-sm">
          {item.label} · {item.propertyName}
        </p>
        <p className="truncate text-muted-foreground text-xs">{item.detail}</p>
      </div>
      <Link
        href={item.href}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Review
      </Link>
    </div>
  );
}

/**
 * Card whose body expands from a one-line header. `aside` is the collapsed
 * summary shown next to the title so the section is useful while closed.
 */
function CollapsibleSection({
  title,
  aside,
  defaultOpen = false,
  children,
}: {
  title: string;
  aside: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0 bg-background py-0">
      <Collapsible defaultOpen={defaultOpen}>
        <h2>
          <CollapsibleTrigger className="group flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3.5 text-left outline-none hover:bg-muted/40 focus-visible:inset-ring-3 focus-visible:inset-ring-ring/50">
            <span className="flex items-center gap-2 font-medium">
              <ChevronRight
                className="size-4 text-muted-foreground transition-transform group-data-panel-open:rotate-90"
                aria-hidden="true"
              />
              {title}
            </span>
            <span className="pl-6 font-normal text-muted-foreground text-sm sm:pl-0">
              {aside}
            </span>
          </CollapsibleTrigger>
        </h2>
        <CollapsibleContent>
          <div className="border-t">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function FinancialsSection({
  summary,
}: {
  summary: PortfolioDashboardSummary;
}) {
  const { totals } = summary;
  const incomplete = totals.incompleteTransactionCount;

  return (
    <CollapsibleSection
      title="Financials"
      defaultOpen
      aside={
        <span className="flex flex-wrap gap-x-5 tabular-nums">
          <SummaryFigure label="Income" value={totals.grossRentalIncome} />
          <SummaryFigure label="Expenses" value={totals.deductibleExpenses} />
          <SummaryFigure label="Net" value={totals.netRecordedRentalIncome} />
        </span>
      }
    >
      {incomplete > 0 ? (
        // Uncategorized entries may be income or expenses, so every total is
        // provisional until they are categorized.
        <p
          className={cn(
            "flex items-center gap-2 border-b px-4 py-2.5 text-sm",
            toneSurface.review,
          )}
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          Totals are provisional until {plural(incomplete, "transaction")}{" "}
          {incomplete === 1 ? "is" : "are"} categorized.
        </p>
      ) : null}
      <div className="overflow-x-auto px-2 pb-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                Income
              </TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                Expenses
              </TableHead>
              <TableHead className="text-right">Net</TableHead>
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
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-md",
                        toneSurface[statusTone(property.status)],
                      )}
                    >
                      {statusLabel(property.status, summary.taxYear)}
                    </Badge>
                  </TableCell>
                  <MoneyCell
                    value={property.grossRentalIncome}
                    inactive={inactive}
                    className="hidden sm:table-cell"
                  />
                  <MoneyCell
                    value={property.deductibleExpenses}
                    inactive={inactive}
                    className="hidden sm:table-cell"
                  />
                  <MoneyCell
                    value={property.netRecordedRentalIncome}
                    inactive={inactive}
                  />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </CollapsibleSection>
  );
}

function SummaryFigure({ label, value }: { label: string; value: number }) {
  return (
    <span>
      {label}{" "}
      <span className="font-medium text-foreground">{formatMoney(value)}</span>
    </span>
  );
}

function MoneyCell({
  value,
  inactive,
  className,
}: {
  value: number;
  inactive: boolean;
  className?: string;
}) {
  return (
    <TableCell className={cn("text-right tabular-nums", className)}>
      {inactive ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        formatMoney(value)
      )}
    </TableCell>
  );
}

function ExpensesSection({ summary }: { summary: PortfolioDashboardSummary }) {
  const [largest] = summary.expenseCategories;

  return (
    <CollapsibleSection
      title="Expenses by T776 category"
      aside={
        largest ? (
          <>
            Largest:{" "}
            <span className="font-medium text-foreground">{largest.label}</span>{" "}
            <span className="tabular-nums">{largest.percentage}%</span>
          </>
        ) : (
          "None recorded"
        )
      }
    >
      {summary.expenseCategories.length === 0 ? (
        <p className="px-4 py-4 text-muted-foreground text-sm">
          No categorized expenses recorded for {summary.taxYear}.
        </p>
      ) : (
        <div className="grid gap-1 py-2">
          {summary.expenseCategories.map((category) => (
            <Link
              href={`/transactions?year=${summary.taxYear}&category=${category.category}`}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-2 text-sm hover:bg-muted/40 sm:grid-cols-[14rem_minmax(0,1fr)_auto]"
              key={category.category}
            >
              <span className="truncate group-hover:underline">
                {category.label}
              </span>
              <span
                className="col-span-2 row-start-2 h-1.5 overflow-hidden rounded-full bg-muted sm:col-span-1 sm:row-start-auto"
                title={`${category.percentage}% of recorded deductible expenses`}
              >
                <span
                  className="block h-full rounded-full bg-brand transition-colors group-hover:bg-brand-hover"
                  style={{ width: `${category.percentage}%` }}
                />
              </span>
              <span className="text-right font-medium tabular-nums">
                {formatMoney(category.amount)}
                <span className="ml-2 inline-block w-12 font-normal text-muted-foreground text-xs">
                  {category.percentage}%
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
}

function statusTone(status: PropertyDashboardStatus) {
  if (status === "ready") return "ready";
  if (status === "needs_review") return "review";
  if (status === "blocked") return "blocked";
  return "inactive";
}

function progressClassName(status: PropertyDashboardStatus) {
  if (status === "ready") return "bg-ready";
  if (status === "needs_review") return "bg-review";
  if (status === "blocked") return "bg-blocked";
  return "bg-muted";
}

function statusLabel(status: PropertyDashboardStatus, taxYear: number) {
  if (status === "ready") return "Ready";
  if (status === "needs_review") return "Needs review";
  if (status === "blocked") return "Blocked";
  return `Not active in ${taxYear}`;
}

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
