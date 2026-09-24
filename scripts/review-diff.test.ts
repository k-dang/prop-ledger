import { describe, expect, it } from "vitest";
import { annotateDiff, buildReviewPayload } from "./review-diff.mjs";

const diff = [
  "diff --git a/src/a.ts b/src/a.ts",
  "index 1111111..2222222 100644",
  "--- a/src/a.ts",
  "+++ b/src/a.ts",
  "@@ -10,3 +10,3 @@ export function a() {",
  " const x = 1;",
  "-const y = 2;",
  "+const y = 3;",
  " return x + y;",
  "@@ -40,1 +40,2 @@",
  " const z = 4;",
  "+const w = 5;",
  "diff --git a/src/gone.ts b/src/gone.ts",
  "deleted file mode 100644",
  "--- a/src/gone.ts",
  "+++ /dev/null",
  "@@ -1 +0,0 @@",
  "-export const gone = true;",
  "\\ No newline at end of file",
  "",
].join("\n");

describe("annotateDiff", () => {
  it("prefixes hunk lines with GitHub review coordinates", () => {
    expect(annotateDiff(diff).annotated.split("\n").slice(4, 12)).toEqual([
      "@@ -10,3 +10,3 @@ export function a() {",
      "[OLD:10,NEW:10]  const x = 1;",
      "[OLD:11] -const y = 2;",
      "[NEW:11] +const y = 3;",
      "[OLD:12,NEW:12]  return x + y;",
      "@@ -40,1 +40,2 @@",
      "[OLD:40,NEW:40]  const z = 4;",
      "[NEW:41] +const w = 5;",
    ]);
    expect(annotateDiff(diff).annotated).toContain(
      "[OLD:1] -export const gone = true;\n\\ No newline at end of file",
    );
  });
});

describe("buildReviewPayload", () => {
  it("keeps commentable ranges inline and moves the rest to the body", () => {
    const payload = buildReviewPayload(
      {
        body: "Found: 0 critical",
        comments: [
          {
            path: "src/a.ts",
            side: "RIGHT",
            start_line: 10,
            line: 12,
            body: "range",
          },
          {
            path: "src/gone.ts",
            side: "LEFT",
            line: 1,
            body: "deleted",
            extra: 1,
          },
          {
            path: "src/a.ts",
            side: "RIGHT",
            start_line: 12,
            line: 41,
            body: "spans hunks",
          },
          {
            path: "src/a.ts",
            side: "LEFT",
            line: 11,
            start_line: 11,
            body: "empty range",
          },
          { path: "src/b.ts", side: "RIGHT", line: 1, body: "not in diff" },
        ],
      },
      diff,
      "abc123",
    );

    expect(payload.comments).toEqual([
      {
        path: "src/a.ts",
        side: "RIGHT",
        start_line: 10,
        start_side: "RIGHT",
        line: 12,
        body: "range",
      },
      { path: "src/gone.ts", side: "LEFT", line: 1, body: "deleted" },
    ]);
    expect(payload).toMatchObject({ commit_id: "abc123", event: "COMMENT" });
    expect(payload.body).toBe(
      [
        "Found: 0 critical",
        "### Comments outside the diff",
        "**`src/a.ts:41`**\n\nspans hunks",
        "**`src/a.ts:11`**\n\nempty range",
        "**`src/b.ts:1`**\n\nnot in diff",
      ].join("\n\n"),
    );
  });

  it("rejects output that does not match the contract", () => {
    expect(() => buildReviewPayload({ comments: [] }, diff, "abc")).toThrow();
    expect(() =>
      buildReviewPayload(
        {
          body: "x",
          comments: [{ path: "src/a.ts", side: "UP", line: 1, body: "y" }],
        },
        diff,
        "abc",
      ),
    ).toThrow("Review comment 0");
  });
});
