import { readFileSync } from "node:fs";

// Diff helpers for .github/workflows/review-pull-requests.yml. The workflow
// annotates the pull request diff so the review agent can copy exact comment
// coordinates, then turns the agent's review into a GitHub review payload.
// Comments GitHub would reject are moved onto the review body instead of failing
// the whole review.
//
//   node scripts/review-diff.mts annotate < raw.diff > pr.diff
//   node scripts/review-diff.mts payload review.json raw.diff <head-sha> > payload.json

type Side = "LEFT" | "RIGHT";

export type ReviewComment = {
  path: string;
  line: number;
  side: Side;
  start_line?: number;
  body: string;
};

export type Review = { body: string; comments: ReviewComment[] };

const lineKey = (path: string, side: Side, line: number) =>
  `${path}\u0000${side}\u0000${line}`;

// Prefixes every hunk line with the line numbers GitHub uses for review
// comments, and returns the hunk index of every commentable (path, side, line).
// Git C-quotes paths with spaces or non-ASCII characters; comments on those
// files fall back to the review body.
export function annotateDiff(diff: string) {
  const annotated: string[] = [];
  const hunks = new Map<string, number>();
  let path = "";
  let oldLine = 0;
  let newLine = 0;
  let hunk = 0;
  let inHunk = false;

  for (const text of diff.split("\n")) {
    if (text.startsWith("diff --git ")) {
      path = "";
      inHunk = false;
    } else if (!inHunk && text.startsWith("--- a/")) {
      path = text.slice("--- a/".length);
    } else if (!inHunk && text.startsWith("+++ b/")) {
      path = text.slice("+++ b/".length);
    }

    const header = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(text);
    if (header) {
      oldLine = Number(header[1]);
      newLine = Number(header[2]);
      hunk += 1;
      inHunk = true;
      annotated.push(text);
    } else if (inHunk && text.startsWith("+")) {
      hunks.set(lineKey(path, "RIGHT", newLine), hunk);
      annotated.push(`[NEW:${newLine}] ${text}`);
      newLine += 1;
    } else if (inHunk && text.startsWith("-")) {
      hunks.set(lineKey(path, "LEFT", oldLine), hunk);
      annotated.push(`[OLD:${oldLine}] ${text}`);
      oldLine += 1;
    } else if (inHunk && text.startsWith(" ")) {
      hunks.set(lineKey(path, "LEFT", oldLine), hunk);
      hunks.set(lineKey(path, "RIGHT", newLine), hunk);
      annotated.push(`[OLD:${oldLine},NEW:${newLine}] ${text}`);
      oldLine += 1;
      newLine += 1;
    } else {
      annotated.push(text);
    }
  }

  return { annotated: annotated.join("\n"), hunks };
}

const isSide = (value: unknown): value is Side =>
  value === "LEFT" || value === "RIGHT";

const isLine = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) > 0;

// Checks the agent's output against the review-pr skill contract and keeps only
// the known fields, so the agent cannot set other GitHub review options.
export function parseReview(value: unknown): Review {
  const review = value as Partial<Record<keyof Review, unknown>> | null;
  if (
    typeof review?.body !== "string" ||
    !review.body.trim() ||
    !Array.isArray(review.comments)
  ) {
    throw new Error("Review must be { body: non-empty string, comments: [] }");
  }

  const comments = review.comments.map((item: unknown, index) => {
    const comment = item as Partial<Record<keyof ReviewComment, unknown>>;
    if (
      typeof comment?.path !== "string" ||
      !isLine(comment.line) ||
      !isSide(comment.side) ||
      (comment.start_line !== undefined && !isLine(comment.start_line)) ||
      typeof comment.body !== "string" ||
      !comment.body.trim()
    ) {
      throw new Error(`Review comment ${index} does not match the contract`);
    }
    return {
      path: comment.path,
      line: comment.line,
      side: comment.side,
      ...(comment.start_line === undefined
        ? {}
        : { start_line: comment.start_line }),
      body: comment.body,
    };
  });

  return { body: review.body, comments };
}

// Builds the body of POST /repos/{owner}/{repo}/pulls/{number}/reviews. A
// comment stays inline only when every line it covers is in one diff hunk.
export function buildReviewPayload(
  value: unknown,
  diff: string,
  commitId: string,
) {
  const review = parseReview(value);
  const { hunks } = annotateDiff(diff);
  const inline: ReviewComment[] = [];
  const outside: ReviewComment[] = [];

  for (const comment of review.comments) {
    const hunk = hunks.get(lineKey(comment.path, comment.side, comment.line));
    const startHunk =
      comment.start_line === undefined
        ? hunk
        : hunks.get(lineKey(comment.path, comment.side, comment.start_line));
    const ordered =
      comment.start_line === undefined || comment.start_line < comment.line;
    (hunk !== undefined && startHunk === hunk && ordered
      ? inline
      : outside
    ).push(comment);
  }

  const body = outside.length
    ? [
        review.body,
        "### Comments outside the diff",
        ...outside.map(
          (comment) =>
            `**\`${comment.path}:${comment.line}\`**\n\n${comment.body}`,
        ),
      ].join("\n\n")
    : review.body;

  return {
    commit_id: commitId,
    event: "COMMENT",
    body,
    comments: inline.map(({ start_line, ...comment }) =>
      start_line === undefined
        ? comment
        : { ...comment, start_line, start_side: comment.side },
    ),
  };
}

if (import.meta.main) {
  const [command, ...args] = process.argv.slice(2);
  if (command === "annotate") {
    process.stdout.write(annotateDiff(readFileSync(0, "utf8")).annotated);
  } else if (command === "payload" && args.length === 3) {
    const [reviewPath, diffPath, commitId] = args;
    const payload = buildReviewPayload(
      JSON.parse(readFileSync(reviewPath, "utf8")),
      readFileSync(diffPath, "utf8"),
      commitId,
    );
    process.stdout.write(JSON.stringify(payload));
  } else {
    console.error(
      "Usage: review-diff.mts annotate | payload <review.json> <raw.diff> <head-sha>",
    );
    process.exit(1);
  }
}
