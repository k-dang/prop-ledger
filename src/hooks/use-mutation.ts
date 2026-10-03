"use client";

import { useState } from "react";
import type { ActionResult } from "@/lib/action-utils";

/** Keep mutation feedback with the form or record that owns the action. */
export function useMutation() {
  const [error, setError] = useState<string>();

  async function runMutation<Result extends ActionResult>(
    mutate: () => Promise<Result>,
  ): Promise<Result> {
    const result = await mutate();
    setError(result.ok ? undefined : result.error);
    return result;
  }

  return { error, runMutation };
}
