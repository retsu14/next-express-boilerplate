import { notFound } from "next/navigation";

import type { Task } from "@/Domain/Tasks/Models/Task";
import { ApiRequestError } from "@/Support/Http/ApiRequestError";
import { Notice } from "@/Support/UI/Notice";
import { describeError } from "@/Support/UI/describeError";
import { serverTasksApi } from "../serverTasksApi";
import { TaskDetails } from "./TaskDetails";

type TaskDetailsSectionProps = Readonly<{
  id: string;
}>;

/** Server Component: loads one task, then hands it to the interactive view. */
export async function TaskDetailsSection({ id }: TaskDetailsSectionProps) {
  let task: Task;

  try {
    task = await serverTasksApi.find(id, { cache: "no-store" });
  } catch (cause: unknown) {
    // A malformed id is answered with 400; to a visitor it is simply missing.
    if (cause instanceof ApiRequestError && (cause.isNotFound || cause.status === 400)) {
      notFound();
    }

    return (
      <Notice tone="error">
        Could not load the task: {describeError(cause, "Unknown error.")}
      </Notice>
    );
  }

  return <TaskDetails task={task} />;
}
