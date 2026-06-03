"use client";

import { useState } from "react";

import { createProperty } from "@/lib/actions";
import { PersistenceErrorAlert } from "@/components/property-workspace/persistence-error-alert";
import { PortfolioPanel } from "@/components/property-workspace/portfolio-panel";
import { PropertyForm } from "@/components/property-workspace/property-form";
import type { NewPropertyInput } from "@/components/property-workspace/workspace-types";
import type { PropertyReadiness } from "@/lib/property-workspace";

const SAVE_ERROR_MESSAGE =
  "Unable to save the property. Please try again in a moment.";

export function Dashboard({
  readiness,
  hasProperties,
}: {
  readiness: PropertyReadiness[];
  hasProperties: boolean;
}) {
  const [saveError, setSaveError] = useState<string>();

  async function handleCreateProperty(input: NewPropertyInput) {
    try {
      const saved = await createProperty(input);
      setSaveError(saved ? undefined : SAVE_ERROR_MESSAGE);
      return saved;
    } catch {
      setSaveError(SAVE_ERROR_MESSAGE);
      return false;
    }
  }

  return (
    <>
      <PersistenceErrorAlert error={saveError} />

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          <PropertyForm onSubmit={handleCreateProperty} />
        </aside>

        <PortfolioPanel properties={readiness} hasProperties={hasProperties} />
      </div>
    </>
  );
}
