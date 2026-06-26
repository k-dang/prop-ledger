"use client";

import {
  FileText,
  type LucideIcon,
  Sparkles,
  SquareTerminal,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { ExploreModel } from "./model";
import { ControlDesk } from "./variant-control-desk";
import { FilingRoom } from "./variant-filing-room";
import { WorkingPapers } from "./variant-working-papers";

type VariantKey = "working-papers" | "control-desk" | "filing-room";

const VARIANTS: {
  key: VariantKey;
  label: string;
  tagline: string;
  icon: LucideIcon;
}[] = [
  {
    key: "working-papers",
    label: "Working Papers",
    tagline:
      "An accountant's dossier. Serif headings, ruled structure, the setup as a numbered filing sequence.",
    icon: FileText,
  },
  {
    key: "control-desk",
    label: "Control Desk",
    tagline:
      "A monospaced control surface. Dense, tabular, keyboard-first — built for the year-end power session.",
    icon: SquareTerminal,
  },
  {
    key: "filing-room",
    label: "Filing Room",
    tagline:
      "Calm and guided. Leads with one question — what's left before you file? — and discloses the detail beneath.",
    icon: Sparkles,
  },
];

export function WorkspaceExplorer({ model }: { model: ExploreModel }) {
  const [active, setActive] = useState<VariantKey>("working-papers");
  const current =
    VARIANTS.find((variant) => variant.key === active) ?? VARIANTS[0];

  return (
    <section className="flex min-w-0 flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="font-semibold text-foreground text-lg tracking-tight">
            Design directions
          </h1>
          <p className="text-muted-foreground text-xs">
            Read-only prototypes · same record, three identities
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Design directions"
          className="grid gap-1 rounded-xl bg-muted/60 p-1 ring-1 ring-foreground/10 sm:grid-cols-3"
        >
          {VARIANTS.map((variant) => {
            const Icon = variant.icon;
            const selected = variant.key === active;

            return (
              <button
                key={variant.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(variant.key)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                  selected
                    ? "bg-background font-medium text-foreground shadow-sm ring-1 ring-foreground/10"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    selected ? "text-brand" : "text-muted-foreground",
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{variant.label}</span>
              </button>
            );
          })}
        </div>
        <p className="max-w-[70ch] text-muted-foreground text-sm">
          {current.tagline}
        </p>
      </header>

      <div className="min-w-0">
        {active === "working-papers" && <WorkingPapers model={model} />}
        {active === "control-desk" && <ControlDesk model={model} />}
        {active === "filing-room" && <FilingRoom model={model} />}
      </div>
    </section>
  );
}
