import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import type { Task } from "../../src/Domain/Tasks/Models/Task.js";
import { MysqlTaskStore } from "../../src/Domain/Tasks/Persistence/MysqlTaskStore.js";
import { clearTasks, createTestPool } from "./testDatabase.js";

const pool = createTestPool();
const store = new MysqlTaskStore(pool);

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: randomUUID(),
    title: "Stored task",
    completed: false,
    createdAt: new Date("2024-05-06T07:08:09.123Z"),
    updatedAt: new Date("2024-05-06T07:08:09.123Z"),
    ...overrides,
  };
}

beforeEach(() => clearTasks(pool));
after(() => pool.end());

test("round-trips booleans and UTC dates with millisecond precision", async () => {
  const task = makeTask({ completed: true });

  await store.insert(task);

  assert.deepEqual(await store.findById(task.id), task);
});

test("findById returns null for an unknown id", async () => {
  assert.equal(await store.findById(randomUUID()), null);
});

test("findAll returns the newest tasks first", async () => {
  const older = makeTask({ createdAt: new Date("2024-01-01T00:00:00.000Z") });
  const newer = makeTask({ createdAt: new Date("2024-02-01T00:00:00.000Z") });

  await store.insert(older);
  await store.insert(newer);

  const tasks = await store.findAll();

  assert.deepEqual(tasks.map((task) => task.id), [newer.id, older.id]);
});

test("update reports an existing row even when nothing changed", async () => {
  const task = makeTask();
  await store.insert(task);

  assert.equal(await store.update(task), true);
});

test("update stores completed: false and reports missing rows", async () => {
  const task = makeTask({ completed: true });
  await store.insert(task);

  const reopened: Task = {
    ...task,
    completed: false,
    updatedAt: new Date("2024-05-07T00:00:00.000Z"),
  };

  assert.equal(await store.update(reopened), true);
  assert.deepEqual(await store.findById(task.id), reopened);

  assert.equal(await store.update(makeTask()), false);
});

test("delete reports whether a row was removed", async () => {
  const task = makeTask();
  await store.insert(task);

  assert.equal(await store.delete(task.id), true);
  assert.equal(await store.delete(task.id), false);
  assert.equal(await store.findById(task.id), null);
});
