import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadEvidenceFile } from "./evidence-upload";

function selectedFile() {
  const form = new FormData();
  form.set(
    "file",
    new File(["receipt"], "receipt.pdf", { type: "application/pdf" }),
  );
  return form;
}

describe("direct evidence upload", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects invalid files before requesting storage access", async () => {
    const presign = vi.fn();
    const confirm = vi.fn();
    const form = new FormData();
    form.set("file", new File(["text"], "notes.txt", { type: "text/plain" }));
    expect(await uploadEvidenceFile(form, presign, confirm)).toEqual({
      ok: false,
      error: "Evidence files must be PDF or image files.",
    });
    expect(presign).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it("preserves record validation failures without uploading bytes", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const confirm = vi.fn();
    const failure = {
      ok: false as const,
      error: "That transaction no longer exists.",
    };
    expect(
      await uploadEvidenceFile(selectedFile(), async () => failure, confirm),
    ).toEqual(failure);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it.each(["http", "network"])(
    "does not attach a document after an %s upload failure",
    async (failure) => {
      const fetchMock =
        failure === "http"
          ? vi.fn().mockResolvedValue(new Response(null, { status: 503 }))
          : vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
      vi.stubGlobal("fetch", fetchMock);
      const confirm = vi.fn();
      const result = await uploadEvidenceFile(
        selectedFile(),
        async () => ({
          ok: true,
          uploadUrl: "https://uploads.example.test/receipt",
          objectKey: "receipt",
        }),
        confirm,
      );
      expect(result).toEqual({
        ok: false,
        error:
          "The upload failed, so nothing was attached. Check your connection and try again.",
      });
      expect(confirm).not.toHaveBeenCalled();
    },
  );

  it("returns confirmation failure after a successful byte upload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
    );
    const failure = {
      ok: false as const,
      error: "The uploaded file does not match its declared size.",
    };
    const confirm = vi.fn().mockResolvedValue(failure);
    expect(
      await uploadEvidenceFile(
        selectedFile(),
        async () => ({
          ok: true,
          uploadUrl: "https://uploads.example.test/receipt",
          objectKey: "receipt",
        }),
        confirm,
      ),
    ).toEqual(failure);
    expect(confirm).toHaveBeenCalledWith("receipt", {
      fileName: "receipt.pdf",
      contentType: "application/pdf",
      size: 7,
    });
  });
});
