import { beforeEach, describe, expect, it, vi } from "vitest";

const { insert, returning, withTransaction, refresh } = vi.hoisted(() => ({
  insert: vi.fn(),
  returning: vi.fn(),
  withTransaction: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/db/index", () => ({ db: {}, withTransaction }));
vi.mock("next/cache", () => ({ refresh, updateTag: vi.fn() }));

import {
  leases,
  owners,
  ownershipPeriods,
  properties,
  units,
} from "@/db/schema";
import { emptySetupForm, type SetupForm } from "./property-setup";
import { completePropertySetup } from "./property-setup-actions";

function completeForm(): SetupForm {
  return {
    ...emptySetupForm(),
    property: {
      name: "Test property",
      line1: "100 King Street W",
      line2: "",
      municipality: "Hamilton",
      province: "ON",
      postalCode: "L8P 1A1",
      acquisitionDate: "2021-04-15",
    },
    ownerMode: "solo",
    owners: [{ id: "owner", name: "Kevin", share: "100" }],
    layout: "house",
    units: [
      {
        id: "unit",
        label: "Whole house",
        unitType: "House",
        occupancy: "rented",
        tenantName: "Tenant",
        startDate: "2024-09-01",
        rentAmount: "2000",
        rentFrequency: "monthly",
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  insert.mockReturnValue({ values: vi.fn().mockResolvedValue([]) });
  returning.mockResolvedValue([{ id: "property" }]);
  withTransaction.mockImplementation((action) =>
    action({
      update: () => ({ set: () => ({ where: () => ({ returning }) }) }),
      insert,
    }),
  );
});

describe("completing property setup", () => {
  it("rejects invalid answers before opening a transaction", async () => {
    expect((await completePropertySetup(null, emptySetupForm())).ok).toBe(
      false,
    );
    expect(withTransaction).not.toHaveBeenCalled();
  });

  it("does not insert records when another completion has already cleared the draft", async () => {
    returning.mockResolvedValue([]);
    const result = await completePropertySetup("property", completeForm());
    expect(result).toEqual({
      ok: false,
      error:
        "This property’s setup is already finished. Make changes from the property page.",
    });
    expect(insert).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("creates related records only after claiming the open draft", async () => {
    const result = await completePropertySetup("property", completeForm());
    expect(result).toMatchObject({ ok: true, propertyId: "property" });
    expect(insert.mock.calls.map(([table]) => table)).toEqual([
      owners,
      ownershipPeriods,
      units,
      leases,
    ]);
    expect(returning.mock.invocationCallOrder[0]).toBeLessThan(
      insert.mock.invocationCallOrder[0],
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("creates a new property and its vacant unit together without inserting a lease", async () => {
    const form = completeForm();
    form.units[0].occupancy = "vacant";
    expect((await completePropertySetup(null, form)).ok).toBe(true);
    expect(insert.mock.calls.map(([table]) => table)).toEqual([
      properties,
      owners,
      ownershipPeriods,
      units,
    ]);
    expect(returning).not.toHaveBeenCalled();
  });
});
