import test from "node:test";
import assert from "node:assert/strict";

import { UpdateTaskAction } from "../../src/Domain/Tasks/Actions/UpdateTaskAction.js";
import { InvalidTaskTitleError } from "../../src/Domain/Tasks/Exceptions/InvalidTaskTitleError.js";
import { TaskNotFoundError } from "../../src/Domain/Tasks/Exceptions/TaskNotFoundError.js";
import type { Task } from "../../src/Domain/Tasks/Models/Task.js";

const TASK_ID = "6f1c2a8e-4f5b-4e1a-9d3c-1b2a3c4d5e6f";

function existingTask(overrides: Partial<Task> = {}): Task {
  return {
    id: TASK_ID,
    title: "Original title",
    completed: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function inMemoryTasks(initial: Task[]) {
  const tasks = new Map(initial.map((task) => [task.id, task]));
  const writes: Task[] = [];

  return {
    writes,
    find: async (id: string) => tasks.get(id) ?? null,
    save: async (task: Task) => {
      writes.push(task);

      if (!tasks.has(task.id)) {
        return false;
      }

      tasks.set(task.id, task);
      return true;
    },
  };
}

test("renaming preserves the omitted completed value", async () => {
  const store = inMemoryTasks([existingTask({ completed: true })]);
  const action = new UpdateTaskAction(store.find, store.save);

  const task = await action.execute(TASK_ID, { title: "  Renamed  " });

  assert.equal(task.title, "Renamed");
  assert.equal(task.completed, true);
  assert.ok(task.updatedAt.getTime() > task.createdAt.getTime());
  assert.equal(store.writes.length, 1);
});

test("completing preserves the omitted title", async () => {
  const store = inMemoryTasks([existingTask({ completed: false })]);
  const action = new UpdateTaskAction(store.find, store.save);

  const task = await action.execute(TASK_ID, { completed: true });

  assert.equal(task.title, "Original title");
  assert.equal(task.completed, true);
});

test("completed: false reopens a completed task", async () => {
  const store = inMemoryTasks([existingTask({ completed: true })]);
  const action = new UpdateTaskAction(store.find, store.save);

  const task = await action.execute(TASK_ID, { completed: false });

  assert.equal(task.completed, false);
  assert.equal(store.writes[0]?.completed, false);
});

test("throws TaskNotFoundError for a missing task", async () => {
  const store = inMemoryTasks([]);
  const action = new UpdateTaskAction(store.find, store.save);

  await assert.rejects(
    action.execute(TASK_ID, { completed: true }),
    TaskNotFoundError,
  );

  assert.equal(store.writes.length, 0);
});

test("throws TaskNotFoundError when the task disappears before saving", async () => {
  const action = new UpdateTaskAction(
    async () => existingTask(),
    async () => false,
  );

  await assert.rejects(
    action.execute(TASK_ID, { title: "Renamed" }),
    TaskNotFoundError,
  );
});

test("rejects an invalid title without reading or writing", async () => {
  let reads = 0;
  const store = inMemoryTasks([existingTask()]);
  const action = new UpdateTaskAction(
    async (id) => {
      reads += 1;
      return store.find(id);
    },
    store.save,
  );

  await assert.rejects(
    action.execute(TASK_ID, { title: "x".repeat(201) }),
    InvalidTaskTitleError,
  );
  await assert.rejects(
    action.execute(TASK_ID, { title: "   " }),
    InvalidTaskTitleError,
  );

  assert.equal(reads, 0);
  assert.equal(store.writes.length, 0);
});

test("an update without changes returns the task without writing", async () => {
  const store = inMemoryTasks([existingTask()]);
  const action = new UpdateTaskAction(store.find, store.save);

  const task = await action.execute(TASK_ID, {});

  assert.deepEqual(task, existingTask());
  assert.equal(store.writes.length, 0);
});
