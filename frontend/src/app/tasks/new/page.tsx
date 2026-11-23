import Link from "next/link";

import { CreateTaskForm } from "@/Application/Web/Tasks/Components/CreateTaskForm";

export default function NewTaskPage() {
  return (
    <main className="stack">
      <h1>Create a task</h1>
      <CreateTaskForm />
      <p><Link href="/tasks">Back to all tasks</Link></p>
    </main>
  );
}
