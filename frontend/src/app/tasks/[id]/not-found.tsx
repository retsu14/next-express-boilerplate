import Link from "next/link";

export default function TaskNotFound() {
  return (
    <main className="stack">
      <h1>Task not found</h1>
      <p>This task does not exist or has been deleted.</p>
      <p><Link href="/tasks">Back to all tasks</Link></p>
    </main>
  );
}
