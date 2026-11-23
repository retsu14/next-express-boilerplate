import { z } from "zod";

import type { CreateTaskData } from "../../../../Domain/Tasks/DataTransferObjects/CreateTaskData.js";

const createTaskRequestSchema = z.object({
  title: z.string(),
}).strict();

export function parseCreateTaskRequest(
  input: unknown,
): CreateTaskData {
  const parsed = createTaskRequestSchema.parse(input);

  return {
    title: parsed.title,
  };
}
