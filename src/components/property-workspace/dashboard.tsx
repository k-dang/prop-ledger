"use client";

import { PersistenceErrorAlert } from "@/components/property-workspace/persistence-error-alert";
import { PortfolioPanel } from "@/components/property-workspace/portfolio-panel";
import { usePortfolioStore } from "@/components/property-workspace/portfolio-store";
import { PropertyForm } from "@/components/property-workspace/property-form";
import { useTaxYear } from "@/components/property-workspace/tax-year-store";
import type { NewPropertyInput } from "@/components/property-workspace/workspace-types";
import {
  createClientId,
  getPropertyReadiness,
  type RentalProperty,
} from "@/lib/property-workspace";

export function Dashboard() {
  const { portfolio, persistenceError, updatePortfolio } = usePortfolioStore();
  const { taxYear } = useTaxYear();
  const propertyReadiness = portfolio.properties.map((property) =>
    getPropertyReadiness(property, taxYear),
  );

  function handleCreateProperty(input: NewPropertyInput) {
    const property: RentalProperty = {
      id: createClientId("property"),
      ...input,
      units: [],
      owners: [],
      ownershipPeriods: [],
    };

    return updatePortfolio((currentPortfolio) => ({
      properties: [...currentPortfolio.properties, property],
    }));
  }

  return (
    <>
      <PersistenceErrorAlert error={persistenceError} />

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          <PropertyForm onSubmit={handleCreateProperty} />
        </aside>

        <PortfolioPanel properties={propertyReadiness} taxYear={taxYear} />
      </div>
    </>
  );
}
