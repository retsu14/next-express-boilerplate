import { z } from "zod";

const taskIdParameterSchema = z.object({
  id: z.uuid({ message: "The task id must be a UUID." }),
});

export function parseTaskIdParameter(params: unknown): string {
  return taskIdParameterSchema.parse(params).id;
}
