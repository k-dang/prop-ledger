"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import { type StatusTone, toneIcon } from "@/lib/status-styles";
import { cn } from "@/lib/utils";
import type { ExploreModel, SetupTaskStatus } from "./model";

/**
 * Direction A — "Working Papers".
 *
 * The property record presented as an accountant's working-papers file: a serif
 * masthead, hairline rules instead of cards, and the setup steps as a numbered
 * filing sequence. Warmth is carried by the serif/sans contrast and ruled
 * structure, not by a tinted "paper" background (the canvas stays chroma-0).
 */
export function WorkingPapers({ model }: { model: ExploreModel }) {
  const { property, readiness, counts } = model;
  const gaps = readiness.tasks.filter((task) => task.status !== "complete");

  return (
    <article className="font-serif text-foreground">
      <div className="mx-auto max-w-4xl rounded-xl bg-background px-6 py-8 ring-1 ring-foreground/10 sm:px-10 sm:py-10">
        {/* Masthead */}
        <header className="border-foreground/15 border-b pb-6">
          <p className="font-sans font-medium text-[0.6875rem] text-muted-foreground uppercase tracking-[0.18em]">
            Property working papers
          </p>
          <h2 className="mt-3 text-pretty font-semibold text-4xl leading-[1.1] tracking-[-0.01em] sm:text-5xl">
            {property.name}
          </h2>
          <p className="mt-3 font-sans text-muted-foreground text-sm">
            {property.line1}, {property.municipality}, {property.province}{" "}
            {property.postalCode}
            <span className="px-2 text-foreground/25">·</span>
            Acquired {property.acquisitionDate}
          </p>
        </header>

        {/* Standing of the file */}
        <section className="grid gap-6 border-foreground/15 border-b py-7 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="font-sans font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
              Standing of the file
            </p>
            <p className="mt-2 max-w-[42ch] text-pretty text-2xl leading-snug">
              <span className="font-semibold tabular-nums">
                {readiness.completedCount}
              </span>{" "}
              of <span className="tabular-nums">{readiness.totalCount}</span>{" "}
              records complete.
              {gaps.length > 0 ? (
                <span className="text-muted-foreground">
                  {" "}
                  {gaps.length === 1
                    ? "One item still needs attention before filing."
                    : `${gaps.length} items still need attention before filing.`}
                </span>
              ) : (
                <span className="text-ready-text">
                  {" "}
                  The file is ready to file.
                </span>
              )}
            </p>
            <Meter value={readiness.readinessPercent} />
          </div>
          <p className="font-sans text-right text-muted-foreground text-xs">
            <span className="block font-semibold text-4xl text-foreground tabular-nums">
              {readiness.readinessPercent}%
            </span>
            ready
          </p>
        </section>

        {/* Setup sequence — a genuine ordered filing sequence */}
        <Section title="Setup sequence" caption="Work the file in order.">
          <ol className="font-sans">
            {readiness.tasks.map((task, index) => (
              <li
                key={task.id}
                className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 border-foreground/10 border-b py-4 last:border-b-0"
              >
                <span className="font-serif text-2xl text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-base">{task.label}</p>
                  <p className="mt-0.5 text-muted-foreground text-sm">
                    {task.detail}
                  </p>
                </div>
                <StatusMark status={task.status} />
              </li>
            ))}
          </ol>
        </Section>

        {/* Particulars */}
        <Section
          title="Particulars"
          caption="Details carried across annual records."
        >
          <dl className="grid font-sans sm:grid-cols-2">
            <Particular label="Municipality" value={property.municipality} />
            <Particular label="Province" value={property.province} />
            <Particular label="Postal code" value={property.postalCode} />
            <Particular
              label="Acquisition date"
              value={property.acquisitionDate}
            />
          </dl>
        </Section>

        {/* Units */}
        <Section
          title="Units"
          caption={`${counts.units} rental ${counts.units === 1 ? "space" : "spaces"} on record.`}
        >
          {model.units.length === 0 ? (
            <Blank>
              No units recorded yet — add the first to clear this line.
            </Blank>
          ) : (
            <Ledger
              head={["Unit", "Type"]}
              rows={model.units.map((unit) => [unit.label, unit.unitType])}
            />
          )}
        </Section>

        {/* Ownership */}
        <Section
          title="Ownership"
          caption="Effective-dated shares. Must total 100% on every date."
        >
          {model.ownership.length === 0 ? (
            <Blank>No ownership periods recorded.</Blank>
          ) : (
            <Ledger
              head={["Owner", "Share", "Effective"]}
              align={[undefined, "right", "right"]}
              rows={model.ownership.map((period) => [
                period.ownerName,
                period.percentageLabel,
                period.dateRange,
              ])}
            />
          )}
        </Section>

        {/* Records on file */}
        <section className="pt-7">
          <p className="font-sans font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
            Records on file
          </p>
          <dl className="mt-4 grid grid-cols-3 font-sans">
            <Tally label="Documents" value={counts.documents} />
            <Tally label="Ledger entries" value={counts.ledgerEntries} />
            <Tally label="Mortgage payments" value={counts.mortgagePayments} />
          </dl>
        </section>
      </div>
    </article>
  );
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-foreground/15 border-b py-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-semibold text-xl tracking-[-0.01em]">{title}</h3>
        <p className="font-sans text-muted-foreground text-sm">{caption}</p>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Meter({ value }: { value: number }) {
  return (
    <div
      className="mt-4 h-px w-full max-w-md bg-foreground/15"
      role="img"
      aria-label={`${value}% ready`}
    >
      <div
        className="-mt-px h-0.5 bg-foreground"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

const TONE_BY_STATUS: Record<SetupTaskStatus, StatusTone> = {
  complete: "ready",
  missing: "review",
  warning: "blocked",
};

const ICON_BY_STATUS: Record<SetupTaskStatus, LucideIcon> = {
  complete: CheckCircle2,
  missing: CircleDot,
  warning: AlertTriangle,
};

const LABEL_BY_STATUS: Record<SetupTaskStatus, string> = {
  complete: "Complete",
  missing: "Outstanding",
  warning: "Review",
};

function StatusMark({ status }: { status: SetupTaskStatus }) {
  const Icon = ICON_BY_STATUS[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        toneIcon[TONE_BY_STATUS[status]],
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {LABEL_BY_STATUS[status]}
    </span>
  );
}

function Particular({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-foreground/10 border-b py-3 last:border-b-0 sm:odd:pr-6 sm:[&:nth-last-child(2)]:border-b-0">
      <dt className="text-muted-foreground text-xs uppercase tracking-[0.08em]">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-sm">{value}</dd>
    </div>
  );
}

function Ledger({
  head,
  rows,
  align = [],
}: {
  head: string[];
  rows: string[][];
  align?: ("right" | undefined)[];
}) {
  return (
    <table className="w-full font-sans text-sm">
      <thead>
        <tr className="border-foreground/15 border-b text-left text-muted-foreground text-xs uppercase tracking-[0.08em]">
          {head.map((cell, index) => (
            <th
              key={cell}
              className={cn(
                "pb-2 font-medium",
                align[index] === "right" && "text-right",
              )}
            >
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.join("|")}
            className="border-foreground/10 border-b last:border-b-0"
          >
            {row.map((cell, index) => (
              <td
                key={head[index]}
                className={cn(
                  "py-2.5",
                  index === 0 ? "font-medium" : "text-muted-foreground",
                  align[index] === "right" && "text-right tabular-nums",
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

function Tally({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="font-serif font-semibold text-3xl tabular-nums">
        {value}
      </dd>
      <dt className="mt-1 text-muted-foreground text-xs">{label}</dt>
    </div>
  );
}

function Blank({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-muted-foreground text-sm italic">{children}</p>
  );
}
