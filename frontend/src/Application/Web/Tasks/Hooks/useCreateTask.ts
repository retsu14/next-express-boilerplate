"use client";

import { useRef, useState } from "react";

import type { Task } from "@/Domain/Tasks/Models/Task";
import { describeError } from "@/Support/UI/describeError";
import { browserTasksApi } from "../browserTasksApi";
import { taskFormSchema } from "../Requests/taskFormSchema";

export function useCreateTask() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTask, setCreatedTask] = useState<Task | null>(null);

  const inFlight = useRef(false);

  async function submit(input: unknown): Promise<boolean> {
    if (inFlight.current) {
      return false;
    }

    setError(null);
    setCreatedTask(null);

    const parsed = taskFormSchema.safeParse(input);

    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Check the task details.",
      );
      return false;
    }

    inFlight.current = true;
    setPending(true);

    try {
      const task = await browserTasksApi.create(parsed.data);
      setCreatedTask(task);

      return true;
    } catch (cause: unknown) {
      setError(describeError(cause, "Unable to create the task."));

      return false;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return {
    submit,
    pending,
    error,
    createdTask,
  };
}
