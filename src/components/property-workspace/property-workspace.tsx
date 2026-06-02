"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { PersistenceErrorAlert } from "@/components/property-workspace/persistence-error-alert";
import { usePortfolioStore } from "@/components/property-workspace/portfolio-store";
import { PropertyWorkspaceDetail } from "@/components/property-workspace/property-detail";
import type {
  NewOwnerInput,
  NewOwnershipPeriodInput,
  NewUnitInput,
} from "@/components/property-workspace/workspace-types";
import {
  canAddOwnershipPeriod,
  createClientId,
  formatPercent,
  getPropertyReadiness,
  type OwnershipValidationIssue,
  type Portfolio,
  type RentalProperty,
} from "@/lib/property-workspace";

export function PropertyWorkspace({ propertyId }: { propertyId: string }) {
  const { portfolio, persistenceError, updatePortfolio } = usePortfolioStore();
  const selectedProperty = portfolio.properties.find(
    (property) => property.id === propertyId,
  );
  const { ownershipError, addUnit, addOwner, addOwnershipPeriod } =
    useSelectedPropertyActions({ selectedProperty, updatePortfolio });

  return (
    <>
      <PersistenceErrorAlert error={persistenceError} />

      <section className="flex min-w-0 flex-col gap-4">
        {selectedProperty === undefined ? (
          <div className="grid min-h-140 place-items-center rounded-md border border-dashed bg-background p-8 text-center">
            <div className="max-w-md">
              <div className="mx-auto grid size-12 place-items-center rounded-md bg-red-50 text-red-700">
                <AlertTriangle className="size-6" aria-hidden="true" />
              </div>
              <h2 className="mt-4 font-semibold text-xl">Property not found</h2>
              <p className="mt-2 text-muted-foreground text-sm">
                No stored property matches {propertyId}. Select another property
                from the dashboard.
              </p>
            </div>
          </div>
        ) : (
          <PropertyWorkspaceDetail
            property={selectedProperty}
            readiness={getPropertyReadiness(selectedProperty)}
            ownershipError={ownershipError}
            onAddUnit={addUnit}
            onAddOwner={addOwner}
            onAddOwnershipPeriod={addOwnershipPeriod}
          />
        )}
      </section>
    </>
  );
}

function useSelectedPropertyActions({
  selectedProperty,
  updatePortfolio,
}: {
  selectedProperty: RentalProperty | undefined;
  updatePortfolio: (updater: (portfolio: Portfolio) => Portfolio) => boolean;
}) {
  const [ownershipError, setOwnershipError] = useState<string>();

  function addUnit(input: NewUnitInput) {
    if (selectedProperty === undefined) {
      return false;
    }

    return updateSelectedProperty((property) => ({
      ...property,
      units: [
        ...property.units,
        {
          id: createClientId("unit"),
          ...input,
        },
      ],
    }));
  }

  function addOwner(input: NewOwnerInput) {
    if (selectedProperty === undefined) {
      return false;
    }

    return updateSelectedProperty((property) => ({
      ...property,
      owners: [
        ...property.owners,
        {
          id: createClientId("owner"),
          ...input,
        },
      ],
    }));
  }

  function addOwnershipPeriod(input: NewOwnershipPeriodInput) {
    if (selectedProperty === undefined) {
      return false;
    }

    const nextPeriod = {
      id: createClientId("ownership"),
      ...input,
    };
    const validation = canAddOwnershipPeriod(
      selectedProperty.ownershipPeriods,
      nextPeriod,
    );

    if (!validation.ok) {
      setOwnershipError(formatOwnershipIssue(validation.issues[0]));
      return false;
    }

    if (
      !updateSelectedProperty((property) => ({
        ...property,
        ownershipPeriods: [...property.ownershipPeriods, nextPeriod],
      }))
    ) {
      return false;
    }

    setOwnershipError(undefined);
    return true;
  }

  function updateSelectedProperty(
    updater: (property: RentalProperty) => RentalProperty,
  ) {
    if (selectedProperty === undefined) {
      return false;
    }

    const selectedId = selectedProperty.id;

    return updatePortfolio((currentPortfolio) => ({
      properties: currentPortfolio.properties.map((property) =>
        property.id === selectedId ? updater(property) : property,
      ),
    }));
  }

  return {
    ownershipError,
    addUnit,
    addOwner,
    addOwnershipPeriod,
  };
}

function formatOwnershipIssue(issue: OwnershipValidationIssue | undefined) {
  if (issue === undefined) {
    return "Review ownership shares.";
  }

  if (issue.code === "OVER_ALLOCATED") {
    return `${issue.message} ${formatPercent(issue.totalPercentage ?? 0)}% is active on ${issue.date}.`;
  }

  return issue.message;
}
