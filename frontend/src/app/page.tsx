import Link from "next/link";

export default function HomePage() {
  return (
    <main className="stack">
      <h1>Tasks starter</h1>
      <p>
        A small domain-oriented starter: Next.js talks to an Express API, which
        owns the business rules and stores tasks in MySQL.
      </p>
      <p className="row">
        <Link className="button" href="/tasks">View tasks</Link>
        <Link className="button secondary" href="/tasks/new">Create a task</Link>
      </p>
    </main>
  );
}
