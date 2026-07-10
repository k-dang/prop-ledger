import { refresh, updateTag } from "next/cache";

type ActionSuccess = { ok: true };
export type ActionFailure = { ok: false; error?: string };

export type ActionResult = ActionSuccess | ActionFailure;

type RunActionOptions<Success extends ActionSuccess> = {
  invalidate?: readonly string[] | ((result: Success) => readonly string[]);
};

export const SAVE_FAILED_MESSAGE =
  "Something went wrong saving your changes. Please try again.";

/**
 * Runs a mutation that reports its own outcome. Infrastructure failures are
 * caught and returned as data so callers never receive raw server errors.
 */
export async function runAction<Success extends ActionSuccess>(
  label: string,
  mutate: () => Promise<Success | ActionFailure>,
  options?: RunActionOptions<Success>,
): Promise<ActionResult> {
  try {
    const result = await mutate();

    if (result.ok) {
      invalidateCacheTags(resolveInvalidationTags(options?.invalidate, result));
      refresh();
    }

    return result.ok ? { ok: true } : { ok: false, error: result.error };
  } catch (error) {
    console.error(`${label} failed`, error);
    return { ok: false, error: SAVE_FAILED_MESSAGE };
  }
}

function resolveInvalidationTags<Success extends ActionSuccess>(
  invalidate: RunActionOptions<Success>["invalidate"] | undefined,
  result: Success,
) {
  return typeof invalidate === "function"
    ? invalidate(result)
    : (invalidate ?? []);
}

function invalidateCacheTags(tags: readonly string[]) {
  for (const tag of new Set(tags)) {
    updateTag(tag);
  }
}
