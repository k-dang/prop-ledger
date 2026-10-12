// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ActionResult } from "@/lib/action-utils";
import type { DocumentWithLinks } from "@/lib/evidence-binder";
import type { RentalProperty } from "@/lib/property-workspace";

vi.mock("@/lib/evidence-actions", () => ({
  createManualTransaction: vi.fn(),
  deleteEvidenceDocument: vi.fn(),
  deleteManualTransaction: vi.fn(),
}));
vi.mock("@/lib/capital-actions", () => ({
  setTransactionCapitalAssetStatus: vi.fn(),
}));
vi.mock("./transaction-evidence-upload", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./transaction-evidence-upload")>()),
  uploadTransactionEvidence: vi.fn(),
}));

import { DeductionsAndIncomePanel } from "./evidence-workspace";
import { uploadTransactionEvidence } from "./transaction-evidence-upload";

beforeEach(() => {
  vi.mocked(uploadTransactionEvidence).mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
  vi.mocked(uploadTransactionEvidence).mockReset();
});

const property: RentalProperty = {
  id: "property-1",
  name: "King Street Duplex",
  line1: "100 King Street W",
  line2: null,
  municipality: "Hamilton",
  province: "ON",
  postalCode: "L8P 1A1",
  acquisitionDate: "2021-04-15",
  createdAt: new Date("2021-04-15T00:00:00.000Z"),
  setupDraft: null,
  units: [],
  owners: [],
  ownershipPeriods: [],
  mortgagePayments: [],
  ledgerEntries: [
    {
      id: "entry-1",
      propertyId: "property-1",
      type: "income",
      date: "2026-03-01",
      vendor: "Laundry",
      memo: null,
      amount: 60,
      expenseCategory: null,
      incomeCategory: null,
      prepaidStartDate: null,
      prepaidEndDate: null,
      isReconciled: false,
      isCapitalAsset: false,
      reviewNotes: null,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      splits: [],
    },
  ],
  documents: [] as DocumentWithLinks[],
};

function openEvidenceSheet() {
  render(<DeductionsAndIncomePanel property={property} />);
  fireEvent.click(
    screen.getByRole("button", {
      name: "Manage evidence for Laundry: 0 linked",
    }),
  );
}

describe("evidence sheet receipt upload", () => {
  it("offers the lease-style upload action instead of a raw file field", () => {
    openEvidenceSheet();

    const picker = screen.getByLabelText(
      "Receipt or invoice",
    ) as HTMLInputElement;
    expect(picker.type).toBe("file");
    expect(picker.accept).toBe("application/pdf,image/*");
    expect(picker.className).toContain("sr-only");
    expect(screen.getByRole("button", { name: "Attach receipt" })).toBeTruthy();
    expect(
      screen.getByText(
        "PDF or image, up to 20 MB. You can also drop a file here.",
      ),
    ).toBeTruthy();
  });

  it("opens the picker and uploads its selection without a submit step", async () => {
    let finish!: (result: ActionResult) => void;
    vi.mocked(uploadTransactionEvidence).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    openEvidenceSheet();

    const picker = screen.getByLabelText(
      "Receipt or invoice",
    ) as HTMLInputElement;
    const click = vi.spyOn(picker, "click");
    fireEvent.click(screen.getByRole("button", { name: "Attach receipt" }));
    expect(click).toHaveBeenCalledOnce();

    const file = new File(["receipt"], "receipt.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(picker, { target: { files: [file] } });
    expect(uploadTransactionEvidence).toHaveBeenCalledOnce();
    const [propertyId, transactionId, data] = vi.mocked(
      uploadTransactionEvidence,
    ).mock.calls[0];
    expect([propertyId, transactionId, data.get("file")]).toEqual([
      "property-1",
      "entry-1",
      file,
    ]);
    expect(screen.getByRole("status").textContent).toContain(
      "Attaching receipt.pdf…",
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Attach receipt",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    await act(async () => finish({ ok: true }));
    expect(screen.getByRole("status").textContent).toContain(
      "receipt.pdf attached to this record.",
    );
    expect(picker.value).toBe("");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Attach receipt" }),
    );
  });

  it("shows the failure for a rejected upload and retries the same file", async () => {
    vi.mocked(uploadTransactionEvidence)
      .mockResolvedValueOnce({
        ok: false,
        error: "The upload failed. Try again.",
      })
      .mockResolvedValue({ ok: true });
    openEvidenceSheet();

    const picker = screen.getByLabelText(
      "Receipt or invoice",
    ) as HTMLInputElement;
    const file = new File(["receipt"], "receipt.pdf", {
      type: "application/pdf",
    });
    await act(async () =>
      fireEvent.change(picker, { target: { files: [file] } }),
    );
    expect(screen.getByRole("status").textContent).toContain(
      "Something went wrong saving your changes.",
    );

    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Retry upload" })),
    );
    expect(uploadTransactionEvidence).toHaveBeenCalledTimes(2);
    expect(
      vi.mocked(uploadTransactionEvidence).mock.calls[1][2].get("file"),
    ).toBe(file);
    expect(screen.getByRole("status").textContent).toContain(
      "attached to this record",
    );
    expect(screen.queryByRole("button", { name: "Retry upload" })).toBeNull();
  });

  it("drops one valid file at a time and rejects anything else", async () => {
    openEvidenceSheet();

    const zone = screen.getByRole("region", {
      name: "Receipt or invoice for Laundry",
    });
    const file = new File(["receipt"], "receipt.pdf", {
      type: "application/pdf",
    });
    const dataTransfer = { types: ["Files"], files: [file] };
    fireEvent.drop(zone, {
      dataTransfer: { ...dataTransfer, files: [file, file] },
    });
    expect(screen.getByRole("status").textContent).toContain(
      "Choose one receipt at a time.",
    );
    fireEvent.drop(zone, {
      dataTransfer: {
        ...dataTransfer,
        files: [new File(["text"], "notes.txt", { type: "text/plain" })],
      },
    });
    expect(screen.getByRole("status").textContent).toContain(
      "Evidence files must be PDF or image files.",
    );
    expect(uploadTransactionEvidence).not.toHaveBeenCalled();

    act(() => {
      fireEvent.drop(zone, { dataTransfer });
    });
    expect(uploadTransactionEvidence).toHaveBeenCalledOnce();
    expect(
      vi.mocked(uploadTransactionEvidence).mock.calls[0][2].get("file"),
    ).toBe(file);
    await act(async () => {});
    expect(screen.getByRole("status").textContent).toContain(
      "receipt.pdf attached to this record.",
    );
  });
});
