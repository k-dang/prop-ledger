# Portfolio dashboard design

## Problem

The existing `/dashboard` is primarily a property-creation form plus setup list. The
replacement must summarize financial records and live year-end readiness across a
portfolio, while preserving the app's accrual-based rent model, Tax Year scoping,
property-level ownership boundaries, and server-first Next.js architecture.

## Shape

`src/lib/portfolio-dashboard.ts` is the pure boundary between hydrated property
records and dashboard presentation. It accepts property aggregates with rent events
and returns serializable summaries containing portfolio KPIs, property rows, a
severity-sorted attention queue, readiness counts, and T776 category totals. All
Tax Year filtering and active-property rules live here, so UI components never
reimplement financial or readiness rules.

`src/db/queries.ts` adds a dashboard-specific read that hydrates rent events alongside
the existing property aggregate. `src/app/dashboard/page.tsx` awaits the promised
search parameters and database read in parallel, parses the selected Tax Year, and
passes one summary to the server-rendered dashboard component.

The main dashboard remains a Server Component. The add-property sheet is a narrow
Client Component because it owns dialog state and invokes a server action. The Tax
Year selector uses a GET form, keeping URL state authoritative. Transaction filters
read and update URL parameters so dashboard drill-down links open exact records.

```ts
type DashboardPropertySource = RentalProperty & { rentEvents: RentEvent[] };

type PropertyDashboardStatus =
  | "ready"
  | "needs_review"
  | "blocked"
  | "not_active";

type PortfolioDashboardSummary = {
  taxYear: number;
  availableTaxYears: number[];
  totals: FinancialSummary;
  readinessCounts: Record<PropertyDashboardStatus, number>;
  attentionItems: DashboardAttentionItem[];
  expenseCategories: ExpenseCategorySummary[];
  properties: PropertyDashboardSummary[];
};

function buildPortfolioDashboard(
  properties: DashboardPropertySource[],
  taxYear: number,
  currentYear?: number,
): PortfolioDashboardSummary;
```

## Synthesis decision

The local synthesis selected a dedicated pure summary module over calculations in the
route or UI. Parallel arena candidates were not run because this session disallows
sub-agents unless explicitly requested. The selected shape minimizes serialized data,
keeps calculation rules testable, and leaves interactive state at narrow client
boundaries.

## Tradeoffs accepted

- We accept one dashboard-specific database hydration in exchange for not expanding
  every `RentalProperty` read with rent events.
- We accept recorded-value KPIs without year-over-year deltas in exchange for avoiding
  misleading partial-year comparisons.
- We accept a simple CSS category visualization in exchange for avoiding a charting
  dependency for a small ranked dataset.
- We accept property-level ownership detail staying outside the portfolio view in
  exchange for preserving effective-dated ownership context.

## Alternatives considered

- Calculating KPIs inside the React component lost because financial rules would become
  coupled to presentation and difficult to test.
- Reusing Year-End Package snapshots lost because those artifacts are immutable exports,
  while the dashboard must reflect live records.
- Making the whole dashboard a Client Component lost because only property creation is
  interactive and the additional client bundle would provide no benefit.

## Open questions and risks

- KPI completeness depends on users resolving uncategorized transactions; the UI must
  label affected totals as incomplete rather than final.
- A property acquired after the selected Tax Year must remain visible without affecting
  totals or readiness counts.
- The destructive portfolio reset must remain behind a typed confirmation in Settings.

## Next implementation step

Implement and test the pure portfolio aggregation contract before filling in the route
and dashboard presentation.
