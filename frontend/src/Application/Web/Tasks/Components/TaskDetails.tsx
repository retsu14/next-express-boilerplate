"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import type { Task } from "@/Domain/Tasks/Models/Task";
import { Notice } from "@/Support/UI/Notice";
import { useDeleteTask } from "../Hooks/useDeleteTask";
import { useUpdateTask } from "../Hooks/useUpdateTask";
import { toTaskViewModel } from "../ViewModels/toTaskViewModel";

type TaskDetailsProps = Readonly<{
  task: Task;
}>;

export function TaskDetails({ task: initialTask }: TaskDetailsProps) {
  const router = useRouter();
  const titleInputId = useId();

  const [task, setTask] = useState(initialTask);
  const [title, setTitle] = useState(initialTask.title);
  const [message, setMessage] = useState<string | null>(null);

  const updater = useUpdateTask();
  const deleter = useDeleteTask();
  const busy = updater.pending || deleter.pending;

  const view = toTaskViewModel(task);

  async function applyUpdate(
    input: Parameters<typeof updater.update>[1],
    successMessage: string,
  ): Promise<void> {
    setMessage(null);

    const updated = await updater.update(task.id, input);

    if (updated) {
      setTask(updated);
      setTitle(updated.title);
      setMessage(successMessage);
      router.refresh();
    }
  }

  async function handleRename(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await applyUpdate({ title }, "Task renamed.");
  }

  async function handleToggle(): Promise<void> {
    await applyUpdate(
      { completed: !task.completed },
      task.completed ? "Task reopened." : "Task completed.",
    );
  }

  async function handleDelete(): Promise<void> {
    if (!window.confirm(`Delete "${task.title}"?`)) {
      return;
    }

    setMessage(null);

    if (await deleter.remove(task.id)) {
      router.push("/tasks");
      router.refresh();
    }
  }

  return (
    <article className="card stack" aria-busy={busy}>
      <header className="stack-sm">
        <h1 className={view.completed ? "done" : undefined}>{view.title}</h1>
        <p className="muted">
          <span className={`badge ${view.completed ? "badge-done" : "badge-open"}`}>
            {view.statusLabel}
          </span>{" "}
          Created {view.createdLabel}
          {view.wasEdited && <> · Updated {view.updatedLabel}</>}
        </p>
      </header>

      <form className="stack-sm" onSubmit={handleRename} noValidate>
        <label htmlFor={titleInputId}>Rename task</label>
        <div className="row">
          <input
            id={titleInputId}
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            disabled={busy}
            autoComplete="off"
            required
          />
          <button type="submit" disabled={busy || title === task.title}>
            {updater.pending ? "Saving..." : "Save title"}
          </button>
        </div>
      </form>

      <div className="row">
        <button type="button" className="secondary" onClick={handleToggle} disabled={busy}>
          {view.toggleLabel}
        </button>
        <button type="button" className="danger" onClick={handleDelete} disabled={busy}>
          {deleter.pending ? "Deleting..." : "Delete task"}
        </button>
      </div>

      {updater.error && <Notice tone="error">{updater.error}</Notice>}
      {deleter.error && <Notice tone="error">{deleter.error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}
    </article>
  );
}
