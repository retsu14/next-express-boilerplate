"use client";

import { useRef, useState } from "react";

import type { UpdateTaskData } from "@/Domain/Tasks/DataTransferObjects/UpdateTaskData";
import type { Task } from "@/Domain/Tasks/Models/Task";
import { describeError } from "@/Support/UI/describeError";
import { browserTasksApi } from "../browserTasksApi";
import { taskFormSchema } from "../Requests/taskFormSchema";

/**
 * Renames, completes or reopens a task. Resolves to the updated task, or
 * null when validation or the request failed (see `error`).
 */
export function useUpdateTask() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inFlight = useRef(false);

  async function update(id: string, input: UpdateTaskData): Promise<Task | null> {
    if (inFlight.current) {
      return null;
    }

    setError(null);

    let data = input;

    if (input.title !== undefined) {
      const parsed = taskFormSchema.safeParse({ title: input.title });

      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Check the task details.");
        return null;
      }

      data = { ...input, title: parsed.data.title };
    }

    inFlight.current = true;
    setPending(true);

    try {
      return await browserTasksApi.update(id, data);
    } catch (cause: unknown) {
      setError(describeError(cause, "Unable to update the task."));

      return null;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return {
    update,
    pending,
    error,
  };
}
