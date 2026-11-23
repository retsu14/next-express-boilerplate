import Link from "next/link";

import { TasksOverview } from "@/Application/Web/Tasks/Components/TasksOverview";

// Always render on request: the task list lives in the API, not in the build.
export const dynamic = "force-dynamic";

export default function TasksPage() {
  return (
    <main className="stack">
      <div className="row spread">
        <h1>Tasks</h1>
        <Link className="button" href="/tasks/new">New task</Link>
      </div>
      <TasksOverview />
    </main>
  );
}
