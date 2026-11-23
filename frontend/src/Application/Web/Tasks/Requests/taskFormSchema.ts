import { z } from "zod";

/**
 * Immediate form feedback only. The API enforces the same title rule
 * independently and remains the authority.
 */
export const taskFormSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Enter a task title.")
    .max(200, "Use no more than 200 characters."),
}).strict();

export type TaskFormValues = z.infer<typeof taskFormSchema>;

/** Returns the first validation message, or null when the input is valid. */
export function firstTaskFormError(input: unknown): string | null {
  const parsed = taskFormSchema.safeParse(input);

  return parsed.success
    ? null
    : parsed.error.issues[0]?.message ?? "Check the task details.";
}
