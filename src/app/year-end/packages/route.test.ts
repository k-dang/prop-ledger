import { beforeEach, describe, expect, it, vi } from "vitest";

const { buildYearEndPackageSnapshot, getYearEndPackageSource } = vi.hoisted(
  () => ({
    buildYearEndPackageSnapshot: vi.fn(),
    getYearEndPackageSource: vi.fn(),
  }),
);

vi.mock("@/db/queries", () => ({ getYearEndPackageSource }));
vi.mock("@/lib/year-end-package", () => ({ buildYearEndPackageSnapshot }));

import { GET } from "./route";

describe("year-end package download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires a property and valid tax year", async () => {
    const response = await GET(
      new Request("https://example.test/year-end/packages?year=invalid"),
    );

    expect(response.status).toBe(400);
    expect(getYearEndPackageSource).not.toHaveBeenCalled();
  });

  it("rejects an owner outside the requested property", async () => {
    getYearEndPackageSource.mockResolvedValue({ owners: [{ id: "owner-a" }] });

    const response = await GET(
      new Request(
        "https://example.test/year-end/packages?propertyId=property-1&year=2026&ownerId=owner-b",
      ),
    );

    expect(response.status).toBe(404);
    expect(buildYearEndPackageSnapshot).not.toHaveBeenCalled();
  });

  it("returns the current snapshot as a download without persisting it", async () => {
    const source = { owners: [{ id: "owner-a" }] };
    const snapshot = {
      property: { name: "King Street Duplex" },
      taxYear: 2026,
      scope: { type: "property", label: "Full property" },
      total: 42,
    };
    getYearEndPackageSource.mockResolvedValue(source);
    buildYearEndPackageSnapshot.mockReturnValue(snapshot);

    const response = await GET(
      new Request(
        "https://example.test/year-end/packages?propertyId=property-1&year=2026",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="king-street-duplex-2026-full-property.json"',
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual(snapshot);
    expect(buildYearEndPackageSnapshot).toHaveBeenCalledWith({
      source,
      taxYear: 2026,
      scope: { type: "property" },
      generatedAt: expect.any(String),
    });
  });
});
