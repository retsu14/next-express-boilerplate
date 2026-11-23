import { z } from "zod";

import type { UpdateTaskData } from "../../../../Domain/Tasks/DataTransferObjects/UpdateTaskData.js";

const updateTaskRequestSchema = z.object({
  title: z.string().optional(),
  completed: z.boolean().optional(),
}).strict().refine(
  (body) => body.title !== undefined || body.completed !== undefined,
  { message: "Provide at least one field to update: title or completed." },
);

export function parseUpdateTaskRequest(
  input: unknown,
): UpdateTaskData {
  const parsed = updateTaskRequestSchema.parse(input);

  return {
    title: parsed.title,
    completed: parsed.completed,
  };
}
