import { afterEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  confirmLeaseDocumentUpload: vi.fn(),
  presignLeaseDocumentUpload: vi.fn(),
}));

vi.mock("@/lib/actions", () => actions);

import { uploadLeaseDocument } from "./lease-document-upload";

describe("lease document upload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uploads the selected file and confirms its lease link", async () => {
    const file = new File(["lease contents"], "lease.pdf", {
      type: "application/pdf",
    });
    const formData = new FormData();
    formData.set("file", file);
    actions.presignLeaseDocumentUpload.mockResolvedValue({
      ok: true,
      uploadUrl: "https://uploads.example.test/lease.pdf",
      objectKey: "object-key-lease.pdf",
    });
    actions.confirmLeaseDocumentUpload.mockResolvedValue({ ok: true });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      uploadLeaseDocument("property-1", "lease-1", formData),
    ).resolves.toEqual({ ok: true });

    expect(actions.presignLeaseDocumentUpload).toHaveBeenCalledWith(
      "property-1",
      "lease-1",
      {
        fileName: "lease.pdf",
        contentType: "application/pdf",
        size: file.size,
      },
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://uploads.example.test/lease.pdf",
      {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      },
    );
    expect(actions.confirmLeaseDocumentUpload).toHaveBeenCalledWith(
      "property-1",
      "lease-1",
      "object-key-lease.pdf",
      {
        fileName: "lease.pdf",
        contentType: "application/pdf",
        size: file.size,
      },
    );
  });
});
