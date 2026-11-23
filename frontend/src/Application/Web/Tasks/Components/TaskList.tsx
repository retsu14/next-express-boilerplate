import Link from "next/link";

import type { Task } from "@/Domain/Tasks/Models/Task";
import { TaskListItem } from "./TaskListItem";

type TaskListProps = Readonly<{
  tasks: readonly Task[];
}>;

/** Server-rendered list; only the per-row controls are client components. */
export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="empty">
        <p>No tasks yet.</p>
        <Link className="button" href="/tasks/new">Create your first task</Link>
      </div>
    );
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        // Remount when the server sends a newer version of the task.
        <TaskListItem key={`${task.id}:${task.updatedAt}`} task={task} />
      ))}
    </ul>
  );
}
