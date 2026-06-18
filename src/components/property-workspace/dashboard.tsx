"use client";

import { useState } from "react";
import { FormErrorAlert } from "@/components/property-workspace/form-error-alert";
import {
  type DashboardPropertyReadiness,
  PortfolioPanel,
} from "@/components/property-workspace/portfolio-panel";
import { PropertyForm } from "@/components/property-workspace/property-form";
import { createProperty } from "@/lib/actions";
import type { NewPropertyInput } from "@/lib/property-workspace";

const SAVE_ERROR_MESSAGE =
  "Unable to save the property. Please try again in a moment.";

export function Dashboard({
  readiness,
  hasProperties,
}: {
  readiness: DashboardPropertyReadiness[];
  hasProperties: boolean;
}) {
  const [saveError, setSaveError] = useState<string>();

  async function handleCreateProperty(input: NewPropertyInput) {
    const result = await createProperty(input);
    setSaveError(result.ok ? undefined : (result.error ?? SAVE_ERROR_MESSAGE));
    return result.ok;
  }

  return (
    <>
      <FormErrorAlert message={saveError} />

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          <PropertyForm onSubmit={handleCreateProperty} />
        </aside>

        <PortfolioPanel properties={readiness} hasProperties={hasProperties} />
      </div>
    </>
  );
}
