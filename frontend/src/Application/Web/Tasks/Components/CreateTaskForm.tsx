"use client";

import Link from "next/link";
import {
  useId,
  useState,
  type FormEvent,
} from "react";

import { Notice } from "@/Support/UI/Notice";
import { useCreateTask } from "../Hooks/useCreateTask";
import { toTaskViewModel } from "../ViewModels/toTaskViewModel";

export function CreateTaskForm() {
  const inputId = useId();
  const [title, setTitle] = useState("");

  const {
    submit,
    pending,
    error,
    createdTask,
  } = useCreateTask();

  const taskView = createdTask
    ? toTaskViewModel(createdTask)
    : null;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const succeeded = await submit({ title });

    if (succeeded) {
      setTitle("");
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit} aria-busy={pending} noValidate>
      <label htmlFor={inputId}>Task title</label>

      <div className="row">
        <input
          id={inputId}
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          disabled={pending}
          autoComplete="off"
          required
        />

        <button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create task"}
        </button>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {taskView && (
        <Notice tone="success">
          Created: {taskView.title} ({taskView.statusLabel}).{" "}
          <Link href={taskView.href}>View task</Link>
        </Notice>
      )}
    </form>
  );
}
