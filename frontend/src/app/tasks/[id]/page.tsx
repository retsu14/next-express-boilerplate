import Link from "next/link";

import { TaskDetailsSection } from "@/Application/Web/Tasks/Components/TaskDetailsSection";

export const dynamic = "force-dynamic";

type TaskPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params;

  return (
    <main className="stack">
      <p><Link href="/tasks">&larr; All tasks</Link></p>
      <TaskDetailsSection id={id} />
    </main>
  );
}
