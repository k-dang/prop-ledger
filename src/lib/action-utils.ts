import { refresh } from "next/cache";

export type ActionResult = { ok: boolean; error?: string };

export const SAVE_FAILED_MESSAGE =
  "Something went wrong saving your changes. Please try again.";

/**
 * Runs a mutation that reports its own outcome. Infrastructure failures are
 * caught and returned as data so callers never receive raw server errors.
 */
export async function runAction(
  label: string,
  mutate: () => Promise<ActionResult>,
): Promise<ActionResult> {
  try {
    const result = await mutate();

    if (result.ok) {
      refresh();
    }

    return result;
  } catch (error) {
    console.error(`${label} failed`, error);
    return { ok: false, error: SAVE_FAILED_MESSAGE };
  }
}
