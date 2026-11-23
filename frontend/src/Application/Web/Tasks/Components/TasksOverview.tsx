import type { Task } from "@/Domain/Tasks/Models/Task";
import { Notice } from "@/Support/UI/Notice";
import { describeError } from "@/Support/UI/describeError";
import { serverTasksApi } from "../serverTasksApi";
import { TaskList } from "./TaskList";

/** Server Component: loads tasks through the internal API address. */
export async function TasksOverview() {
  let tasks: Task[];

  try {
    tasks = await serverTasksApi.list({ cache: "no-store" });
  } catch (cause: unknown) {
    return (
      <Notice tone="error">
        Could not load tasks: {describeError(cause, "Unknown error.")}
      </Notice>
    );
  }

  return <TaskList tasks={tasks} />;
}
