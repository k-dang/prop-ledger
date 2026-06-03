import type { ComponentProps } from "react";
import type { z } from "zod";

export type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>;

/**
 * Builds a form submit handler that parses the form's fields with `schema`
 * (field `name` attributes map directly to schema keys) and, when valid, hands
 * the parsed data to `onValid`. The form is reset only when `onValid` reports a
 * successful save. `onValid` may be async (e.g. a Server Action), in which case
 * the reset waits for the resolved result.
 */
export function createFormSubmit<Schema extends z.ZodType>(
  schema: Schema,
  onValid: (data: z.output<Schema>) => boolean | Promise<boolean>,
): FormSubmitHandler {
  return (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const result = schema.safeParse(Object.fromEntries(new FormData(form)));

    if (!result.success) {
      return;
    }

    void Promise.resolve(onValid(result.data)).then((saved) => {
      if (saved) {
        form.reset();
      }
    });
  };
}
