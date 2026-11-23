import { z } from "zod";

import { requestJson } from "@/Support/Http/requestJson";
import type { CreateTaskData } from "../DataTransferObjects/CreateTaskData";
import type { UpdateTaskData } from "../DataTransferObjects/UpdateTaskData";
import { taskSchema, type Task } from "../Models/Task";

const taskResponseSchema = z.object({
  data: taskSchema,
});

const taskCollectionResponseSchema = z.object({
  data: z.array(taskSchema),
});

export type TasksApi = ReturnType<typeof createTasksApi>;

/**
 * Task endpoints of the Express API. The base URL is passed in, so the same
 * client works in the browser and on the server with different addresses.
 */
export function createTasksApi(baseUrl: string) {
  const url = baseUrl.replace(/\/+$/, "");
  const taskUrl = (id: string) => `${url}/tasks/${encodeURIComponent(id)}`;

  return {
    async list(init: RequestInit = {}): Promise<Task[]> {
      const response = await requestJson(`${url}/tasks`, init);

      return parse(taskCollectionResponseSchema, response, "task list").data;
    },

    async find(id: string, init: RequestInit = {}): Promise<Task> {
      const response = await requestJson(taskUrl(id), init);

      return parse(taskResponseSchema, response, "task").data;
    },

    async create(data: CreateTaskData): Promise<Task> {
      const response = await requestJson(`${url}/tasks`, {
        method: "POST",
        body: JSON.stringify(data),
      });

      return parse(taskResponseSchema, response, "task").data;
    },

    async update(id: string, data: UpdateTaskData): Promise<Task> {
      const response = await requestJson(taskUrl(id), {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      return parse(taskResponseSchema, response, "task").data;
    },

    async delete(id: string): Promise<void> {
      await requestJson(taskUrl(id), { method: "DELETE" });
    },
  };
}

function parse<T>(schema: z.ZodType<T>, response: unknown, label: string): T {
  const parsed = schema.safeParse(response);

  if (!parsed.success) {
    throw new Error(`The API returned an unexpected ${label} response.`);
  }

  return parsed.data;
}
