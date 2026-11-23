import type { Task } from "@/Domain/Tasks/Models/Task";

export type TaskViewModel = Readonly<{
  id: string;
  title: string;
  completed: boolean;
  href: string;
  statusLabel: "Completed" | "Open";
  toggleLabel: "Reopen" | "Mark as completed";
  createdLabel: string;
  updatedLabel: string;
  wasEdited: boolean;
}>;

export function toTaskViewModel(task: Task): TaskViewModel {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    href: `/tasks/${encodeURIComponent(task.id)}`,
    statusLabel: task.completed ? "Completed" : "Open",
    toggleLabel: task.completed ? "Reopen" : "Mark as completed",
    createdLabel: formatUtcTimestamp(task.createdAt),
    updatedLabel: formatUtcTimestamp(task.updatedAt),
    wasEdited: task.updatedAt !== task.createdAt,
  };
}

/**
 * Formats an ISO timestamp as "2024-05-06 07:08 UTC". Locale-independent so
 * server-rendered and hydrated output always match.
 */
export function formatUtcTimestamp(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
