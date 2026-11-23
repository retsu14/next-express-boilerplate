import { z } from "zod";

/**
 * A task as the API serialises it. Dates are ISO strings, not Date objects.
 */
export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Task = z.infer<typeof taskSchema>;
