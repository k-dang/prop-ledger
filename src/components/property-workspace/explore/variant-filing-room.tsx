"use client";

import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDot,
  type LucideIcon,
  MapPin,
} from "lucide-react";
import { type StatusTone, toneChip, toneIcon } from "@/lib/status-styles";
import { cn } from "@/lib/utils";
import type { ExploreModel, SetupTaskStatus } from "./model";

/**
 * Direction C — "Filing Room".
 *
 * Calm and reassurance-led. The surface opens on a single question — what's left
 * before you file? — answered by a readiness ring and the outstanding work, then
 * discloses the supporting detail in quiet panels beneath. The ring is genuine
 * progress (not a decorated hero metric), and indigo is the only accent.
 */
export function FilingRoom({ model }: { model: ExploreModel }) {
  const { property, readiness, counts } = model;
  const outstanding = readiness.tasks.filter((t) => t.status !== "complete");
  const done = readiness.tasks.filter((t) => t.status === "complete");
  const ready = outstanding.length === 0;

  return (
    <div className="flex flex-col gap-6 text-foreground">
      {/* Hero — the one question */}
      <section className="rounded-3xl bg-muted/40 p-6 ring-1 ring-foreground/10 sm:p-10">
        <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
          <Ring value={readiness.readinessPercent} ready={ready} />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-muted-foreground text-sm">
              {property.name}
            </p>
            <h2 className="mt-1 text-balance font-semibold text-3xl leading-tight tracking-tight sm:text-4xl">
              {ready ? "You're ready to file." : "What's left before you file?"}
            </h2>
            <p className="mt-3 max-w-[52ch] text-pretty text-muted-foreground">
              {ready ? (
                "Every setup record for this property is complete and backed by evidence. Nothing is blocking your T776."
              ) : (
                <>
                  {readiness.completedCount} of {readiness.totalCount} setup
                  records are complete.{" "}
                  <span className="text-foreground">
                    {outstanding.length === 1
                      ? "One item still needs your attention"
                      : `${outstanding.length} items still need your attention`}
                  </span>{" "}
                  before this property is filing-ready.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* What's left — the work, led plainly */}
      {!ready && (
        <section>
          <h3 className="font-semibold text-base">Needs your attention</h3>
          <div className="mt-3 flex flex-col gap-3">
            {outstanding.map((task) => (
              <button
                key={task.id}
                type="button"
                className="group flex items-center gap-4 rounded-2xl bg-background p-4 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    toneChip[TONE_BY_STATUS[task.status]],
                  )}
                >
                  <TaskIcon status={task.status} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{task.label}</span>
                  <span className="block text-muted-foreground text-sm">
                    {task.detail}
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Already done — quiet reassurance */}
      {done.length > 0 && (
        <section>
          <h3 className="font-medium text-muted-foreground text-sm">
            Already complete
          </h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {done.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-2.5 text-muted-foreground text-sm"
              >
                <Check
                  className={cn("size-4 shrink-0", toneIcon.ready)}
                  aria-hidden="true"
                />
                <span className="text-foreground">{task.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* At a glance */}
      <section className="rounded-2xl bg-background p-5 ring-1 ring-foreground/10 sm:p-6">
        <h3 className="font-semibold text-base">This property at a glance</h3>
        <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Glance icon={MapPin} label="Address">
            {property.line1}, {property.municipality}, {property.province}{" "}
            {property.postalCode}
          </Glance>
          <Glance icon={CalendarDays} label="Acquired">
            {property.acquisitionDate}
          </Glance>
          <Glance icon={Building2} label="Composition">
            {counts.units} {counts.units === 1 ? "unit" : "units"} ·{" "}
            {counts.owners} {counts.owners === 1 ? "owner" : "owners"}
          </Glance>
        </dl>
      </section>

      {/* Detail panels — disclosed beneath */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Units" count={counts.units}>
          {model.units.length === 0 ? (
            <Soft>No units yet. Add one to clear the setup step above.</Soft>
          ) : (
            <ul className="divide-y divide-border">
              {model.units.map((unit) => (
                <li
                  key={unit.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <span className="font-medium text-sm">{unit.label}</span>
                  <span className="text-muted-foreground text-sm">
                    {unit.unitType}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Ownership" count={counts.ownershipPeriods}>
          {model.ownership.length === 0 ? (
            <Soft>No ownership periods recorded.</Soft>
          ) : (
            <ul className="divide-y divide-border">
              {model.ownership.map((period) => (
                <li
                  key={period.id}
                  className="flex items-baseline justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">
                      {period.ownerName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {period.dateRange}
                    </p>
                  </div>
                  <span className="font-medium text-sm tabular-nums">
                    {period.percentageLabel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
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

function TaskIcon({
  status,
  className,
}: {
  status: SetupTaskStatus;
  className?: string;
}) {
  const Icon = ICON_BY_STATUS[status];
  return <Icon className={className} aria-hidden="true" />;
}

function Ring({ value, ready }: { value: number; ready: boolean }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="relative grid size-32 shrink-0 place-items-center">
      <svg
        viewBox="0 0 120 120"
        className="size-32 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="8"
          className="stroke-foreground/10"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn(ready ? "stroke-ready" : "stroke-brand")}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-semibold text-2xl tabular-nums">{value}%</span>
        <span className="text-muted-foreground text-xs">ready</span>
      </div>
    </div>
  );
}

function Glance({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="mt-0.5 font-medium text-sm">{children}</dd>
      </div>
    </div>
  );
}

function Panel({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-background p-5 ring-1 ring-foreground/10 sm:p-6">
      <div className="flex items-baseline gap-2">
        <h3 className="font-semibold text-base">{title}</h3>
        <span className="text-muted-foreground text-sm tabular-nums">
          {count}
        </span>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Soft({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}
