import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  isSectionComplete,
  SECTION_TITLES,
  SETUP_CHECKLIST,
  setupFormFromProperty,
} from "@/lib/property-setup";
import type { RentalProperty } from "@/lib/property-workspace";
import { cn } from "@/lib/utils";

/**
 * Shown on the property page while guided setup is unfinished (the property
 * has a `setupDraft`). "Continue setup" reopens the wizard at the first
 * unanswered question.
 */
export function FinishSetupCard({
  property,
  today,
}: {
  property: RentalProperty;
  today: string;
}) {
  const form = setupFormFromProperty(property);
  const rows = SETUP_CHECKLIST.map((section) => ({
    section,
    done: isSectionComplete(form, section, today),
  }));
  const remaining = rows.filter((row) => !row.done).length;

  return (
    <section
      id="property-setup"
      aria-labelledby="finish-setup-title"
      className="scroll-mt-4 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5">
        <div className="min-w-0">
          <h2 id="finish-setup-title" className="font-medium">
            Finish setting up
          </h2>
          <p className="text-muted-foreground text-sm tabular-nums">
            {remaining === 1 ? "1 step left" : `${remaining} steps left`}. Rent
            and expenses use these to land on the right unit and owner.
          </p>
        </div>
        <Link
          href={`/properties/${property.id}/setup`}
          className={buttonVariants()}
        >
          Continue setup
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Link>
      </div>
      <ol className="divide-y">
        {rows.map((row, position) => (
          <li key={row.section} className="flex items-center gap-3 px-4 py-3">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border font-semibold text-muted-foreground text-xs tabular-nums",
                row.done && "border-ready-border bg-ready-surface text-ready",
              )}
            >
              {row.done ? (
                <Check className="size-3" aria-hidden="true" />
              ) : (
                position + 1
              )}
            </span>
            <span className="min-w-0 flex-1 font-medium text-sm">
              {SECTION_TITLES[row.section]}
            </span>
            <span className="text-muted-foreground text-sm">
              {row.done ? "Done" : "To do"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
