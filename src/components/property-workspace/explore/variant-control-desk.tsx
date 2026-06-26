"use client";

import { type StatusTone, toneSurface } from "@/lib/status-styles";
import { cn } from "@/lib/utils";
import type { ExploreModel, SetupTaskStatus } from "./model";

/**
 * Direction B — "Control Desk".
 *
 * A monospaced control surface for the year-end power session: dense rows, a
 * hairline grid, a command-bar header, and status rendered as bracketed terminal
 * tags. Stays a light "paper terminal" (chroma-0 canvas, indigo accent) rather
 * than the navy-and-neon cliché.
 */
export function ControlDesk({ model }: { model: ExploreModel }) {
  const { property, readiness, counts } = model;
  const slug = property.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="overflow-hidden rounded-xl font-mono text-foreground text-[0.8125rem] ring-1 ring-foreground/10">
      {/* Command bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-foreground/10 border-b bg-muted/60 px-4 py-2.5">
        <span className="text-brand">~/properties/</span>
        <span className="font-medium">{slug}</span>
        <span
          className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-px bg-brand/70"
          aria-hidden="true"
        />
        <span className="ml-auto text-muted-foreground">
          tax-year{" "}
          <span className="text-foreground">
            {property.acquisitionDate.slice(0, 4)}
          </span>
        </span>
      </div>

      <div className="bg-background">
        {/* Stat strip */}
        <dl className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
          <Stat label="ready" value={`${readiness.readinessPercent}%`} accent />
          <Stat label="gaps" value={readiness.setupGapCount} />
          <Stat label="units" value={counts.units} />
          <Stat label="owners" value={counts.owners} />
          <Stat label="periods" value={counts.ownershipPeriods} />
        </dl>

        {/* Setup checklist */}
        <Block label="setup.check">
          <ul>
            {readiness.tasks.map((task, index) => (
              <li
                key={task.id}
                className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-foreground/10 border-b px-4 py-2.5 last:border-b-0 hover:bg-muted/40"
              >
                <span className="text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{task.label}</p>
                  <p className="truncate text-muted-foreground text-xs">
                    {task.detail}
                  </p>
                </div>
                <StatusTag status={task.status} />
              </li>
            ))}
          </ul>
        </Block>

        {/* Particulars */}
        <Block label="particulars">
          <dl className="grid sm:grid-cols-2">
            <KeyVal
              k="address"
              v={`${property.line1}, ${property.municipality}`}
            />
            <KeyVal k="province" v={property.province} />
            <KeyVal k="postal" v={property.postalCode} />
            <KeyVal k="acquired" v={property.acquisitionDate} />
          </dl>
        </Block>

        {/* Units */}
        <Block label={`units [${counts.units}]`}>
          {model.units.length === 0 ? (
            <Empty>no units recorded</Empty>
          ) : (
            <Rows
              cols={["label", "type"]}
              data={model.units.map((unit) => [unit.label, unit.unitType])}
            />
          )}
        </Block>

        {/* Ownership */}
        <Block label={`ownership [${counts.ownershipPeriods}]`}>
          {model.ownership.length === 0 ? (
            <Empty>no ownership periods recorded</Empty>
          ) : (
            <Rows
              cols={["owner", "share", "effective"]}
              right={[false, true, true]}
              data={model.ownership.map((period) => [
                period.ownerName,
                period.percentageLabel,
                period.dateRange,
              ])}
            />
          )}
        </Block>

        {/* Hints */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-foreground/10 border-t bg-muted/40 px-4 py-2.5 text-[0.6875rem] text-muted-foreground">
          <Hint keys="↑ ↓" label="navigate" />
          <Hint keys="⏎" label="open" />
          <Hint keys="e" label="edit" />
          <Hint keys="⌘K" label="commands" />
          <span className="ml-auto">
            {counts.documents} docs · {counts.ledgerEntries} entries ·{" "}
            {counts.mortgagePayments} payments
          </span>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="px-4 py-3">
      <dt className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-semibold text-2xl tabular-nums",
          accent && "text-brand",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-foreground/10 border-t">
      <p className="bg-muted/30 px-4 py-1.5 text-[0.6875rem] text-muted-foreground">
        <span className="text-brand">#</span> {label}
      </p>
      {children}
    </section>
  );
}

const TAG_BY_STATUS: Record<
  SetupTaskStatus,
  { tone: StatusTone; text: string }
> = {
  complete: { tone: "ready", text: "READY" },
  missing: { tone: "review", text: "MISSING" },
  warning: { tone: "blocked", text: "REVIEW" },
};

function StatusTag({ status }: { status: SetupTaskStatus }) {
  const { tone, text } = TAG_BY_STATUS[status];

  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 text-[0.6875rem] tracking-wide tabular-nums",
        toneSurface[tone],
      )}
    >
      {text}
    </span>
  );
}

function KeyVal({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-2 border-foreground/10 border-b px-4 py-2 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="truncate">{v}</dd>
    </div>
  );
}

function Rows({
  cols,
  data,
  right = [],
}: {
  cols: string[];
  data: string[][];
  right?: boolean[];
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-foreground/10 border-b text-[0.6875rem] text-muted-foreground uppercase tracking-wider">
          {cols.map((col, index) => (
            <th
              key={col}
              className={cn(
                "px-4 py-1.5 text-left font-normal",
                right[index] && "text-right",
              )}
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr
            key={row.join("|")}
            className="border-foreground/10 border-b last:border-b-0 hover:bg-muted/40"
          >
            {row.map((cell, index) => (
              <td
                key={cols[index]}
                className={cn(
                  "px-4 py-2",
                  index === 0 ? "font-medium" : "text-muted-foreground",
                  right[index] && "text-right tabular-nums",
                )}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 py-3 text-muted-foreground">
      <span className="text-foreground/30">{"// "}</span>
      {children}
    </p>
  );
}

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <kbd className="rounded border border-foreground/15 bg-background px-1 py-px text-foreground">
        {keys}
      </kbd>
      {label}
    </span>
  );
}
