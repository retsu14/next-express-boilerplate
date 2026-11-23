"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Task } from "@/Domain/Tasks/Models/Task";
import { Notice } from "@/Support/UI/Notice";
import { useDeleteTask } from "../Hooks/useDeleteTask";
import { useUpdateTask } from "../Hooks/useUpdateTask";
import { toTaskViewModel } from "../ViewModels/toTaskViewModel";

type TaskListItemProps = Readonly<{
  task: Task;
}>;

export function TaskListItem({ task: initialTask }: TaskListItemProps) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [deleted, setDeleted] = useState(false);

  const updater = useUpdateTask();
  const deleter = useDeleteTask();
  const busy = updater.pending || deleter.pending;

  if (deleted) {
    return null;
  }

  const view = toTaskViewModel(task);

  async function toggleCompleted(): Promise<void> {
    const updated = await updater.update(task.id, { completed: !task.completed });

    if (updated) {
      setTask(updated);
      router.refresh();
    }
  }

  async function deleteTask(): Promise<void> {
    if (!window.confirm(`Delete "${task.title}"?`)) {
      return;
    }

    if (await deleter.remove(task.id)) {
      setDeleted(true);
      router.refresh();
    }
  }

  return (
    <li className="task" aria-busy={busy}>
      <div className="task-main">
        <span className={`badge ${view.completed ? "badge-done" : "badge-open"}`}>
          {view.statusLabel}
        </span>
        <Link className={view.completed ? "task-title done" : "task-title"} href={view.href}>
          {view.title}
        </Link>
      </div>

      <div className="row">
        <button type="button" className="secondary" onClick={toggleCompleted} disabled={busy}>
          {updater.pending ? "Saving..." : view.toggleLabel}
        </button>
        <button type="button" className="danger" onClick={deleteTask} disabled={busy}>
          {deleter.pending ? "Deleting..." : "Delete"}
        </button>
      </div>

      {updater.error && <Notice tone="error">{updater.error}</Notice>}
      {deleter.error && <Notice tone="error">{deleter.error}</Notice>}
    </li>
  );
}
