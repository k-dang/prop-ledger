import { describe, expect, it } from "vitest";

import {
  emptySetupForm,
  firstIncompleteStep,
  ownersDroppedBy,
  type SetupForm,
  setupSteps,
  toPropertyValues,
  toSetupRows,
  unitsDroppedBy,
  validateOwnershipStep,
  validatePropertyStep,
  validateSetup,
  validateUnitStep,
  validateUnitsStep,
  withLayout,
  withOwnerMode,
} from "./property-setup";

const TODAY = "2026-10-04";

function completeForm(): SetupForm {
  const form = withLayout(
    withOwnerMode(
      {
        ...emptySetupForm(),
        property: {
          name: "King Street Duplex",
          line1: "100 King Street W",
          line2: "",
          municipality: "Hamilton",
          province: "ON",
          postalCode: "l8p1a1",
          acquisitionDate: "2021-04-15",
        },
      },
      "partner",
    ),
    "duplex",
  );

  return {
    ...form,
    owners: form.owners.map((owner, index) => ({
      ...owner,
      name: ["Alex Chen", "Jordan Chen"][index],
    })),
    units: [
      {
        ...form.units[0],
        occupancy: "rented",
        tenantName: "Priya Shah",
        startDate: "2024-09-01",
        rentAmount: "$2,150",
      },
      { ...form.units[1], occupancy: "vacant" },
    ],
  };
}

describe("property setup validation", () => {
  it("accepts a complete duplex setup", () => {
    expect(validateSetup(completeForm(), TODAY)).toEqual({});
  });

  it("rejects non-Canadian postal codes and future acquisition dates", () => {
    const form = completeForm();
    form.property.postalCode = "90210";
    form.property.acquisitionDate = "2026-10-05";

    expect(validatePropertyStep(form, TODAY)).toEqual({
      "property.postalCode": "Use a Canadian postal code, like L8P 1A1.",
      "property.acquisitionDate":
        "The acquisition date can’t be in the future.",
    });
  });

  it("requires shares to add up to 100%", () => {
    const form = withOwnerMode(completeForm(), "multi");
    form.owners[1].share = "40";

    expect(validateOwnershipStep(form)).toEqual({
      owners: "Shares must add up to 100%. They add up to 90%.",
    });
  });

  it("requires distinct unit names", () => {
    const form = completeForm();
    form.units[1].label = " upper ";

    expect(validateUnitsStep(form)).toEqual({
      "units.1.label": "Each unit needs a different name.",
    });
  });

  it("rejects calendar dates that don't exist and rent that isn't a number", () => {
    const form = completeForm();
    form.property.acquisitionDate = "2025-02-29";
    form.units[0].startDate = "2024-02-29";
    form.units[0].rentAmount = "1e309";

    expect(validatePropertyStep(form, TODAY)).toEqual({
      "property.acquisitionDate": "Enter a valid date.",
    });
    expect(validateUnitStep(form, 0)).toEqual({
      "units.0.rentAmount": "Enter the rent amount.",
    });
  });

  it("only asks for lease details when a unit is rented", () => {
    const form = completeForm();
    form.units[0].tenantName = "";
    form.units[0].rentAmount = "0";

    expect(validateUnitStep(form, 0)).toEqual({
      "units.0.tenantName": "Enter the tenant’s name.",
      "units.0.rentAmount": "Enter the rent amount.",
    });
    expect(validateUnitStep(form, 1)).toEqual({});
  });
});

describe("property setup choices", () => {
  it("keeps typed owner names when switching ownership modes", () => {
    const form = withOwnerMode(completeForm(), "solo");

    expect(form.owners).toMatchObject([{ name: "Alex Chen", share: "100" }]);
  });

  it("keeps tenant answers for units in the same position when the layout changes", () => {
    const form = withLayout(completeForm(), "triplex");

    expect(form.units.map((unit) => [unit.label, unit.tenantName])).toEqual([
      ["Unit 1", "Priya Shah"],
      ["Unit 2", ""],
      ["Unit 3", ""],
    ]);
    expect(setupSteps(form)).toHaveLength(7);
  });

  it("reports answered units and named owners a switch would remove", () => {
    const form = withLayout(completeForm(), "triplex");
    form.units[2].occupancy = "vacant";
    const multi = withOwnerMode(form, "multi");
    multi.owners.push({ id: "3", name: "Casey Chen", share: "" });

    expect(unitsDroppedBy(form, "duplex").map((unit) => unit.label)).toEqual([
      "Unit 3",
    ]);
    expect(unitsDroppedBy(form, "triplex")).toEqual([]);
    expect(
      ownersDroppedBy(multi, "partner").map((owner) => owner.name),
    ).toEqual(["Casey Chen"]);
  });

  it("resumes at the first unanswered screen", () => {
    const form = withLayout(completeForm(), "triplex");

    expect(setupSteps(form)[firstIncompleteStep(form, TODAY)]).toEqual({
      kind: "unit",
      index: 2,
    });
  });
});

describe("property setup records", () => {
  it("normalizes the property row and builds owners, units, and leases", () => {
    const form = completeForm();

    expect(toPropertyValues(form)).toMatchObject({
      line2: null,
      postalCode: "L8P 1A1",
    });

    const rows = toSetupRows(form, "property-1");

    expect(rows.periodRows).toEqual([
      expect.objectContaining({
        ownerId: rows.ownerRows[0].id,
        percentage: 50,
      }),
      expect.objectContaining({
        ownerId: rows.ownerRows[1].id,
        percentage: 50,
      }),
    ]);
    expect(rows.unitRows.map((unit) => unit.label)).toEqual(["Upper", "Lower"]);
    expect(rows.leaseRows).toEqual([
      {
        id: rows.leaseIdByUnit[form.units[0].id],
        unitId: rows.unitRows[0].id,
        tenantName: "Priya Shah",
        startDate: "2024-09-01",
        rentAmount: 2150,
        rentFrequency: "monthly",
      },
    ]);
    expect(Object.keys(rows.leaseIdByUnit)).toEqual([form.units[0].id]);
  });

  it("falls back to the street address for a blank property name", () => {
    const form = completeForm();
    form.property.name = " ";

    expect(toPropertyValues(form).name).toBe("100 King Street W");
  });
});
