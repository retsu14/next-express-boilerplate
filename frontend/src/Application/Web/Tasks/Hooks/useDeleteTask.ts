"use client";

import { useRef, useState } from "react";

import { describeError } from "@/Support/UI/describeError";
import { browserTasksApi } from "../browserTasksApi";

export function useDeleteTask() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inFlight = useRef(false);

  async function remove(id: string): Promise<boolean> {
    if (inFlight.current) {
      return false;
    }

    setError(null);
    inFlight.current = true;
    setPending(true);

    try {
      await browserTasksApi.delete(id);

      return true;
    } catch (cause: unknown) {
      setError(describeError(cause, "Unable to delete the task."));

      return false;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return {
    remove,
    pending,
    error,
  };
}
