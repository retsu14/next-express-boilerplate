import type { Task } from "../../../../Domain/Tasks/Models/Task.js";

export type TaskResource = Readonly<{
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export function toTaskResource(task: Task): TaskResource {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
