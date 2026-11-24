import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

import { asValue, createContainer, InjectionMode } from "awilix";

import { CreateTaskController } from "../../src/Application/Api/Tasks/Controllers/CreateTaskController.js";
import { CreateTaskAction } from "../../src/Domain/Tasks/Actions/CreateTaskAction.js";
import type { Task } from "../../src/Domain/Tasks/Models/Task.js";
import { registerClasses } from "../../src/Support/Container/registerClasses.js";
import { resolveClass } from "../../src/Support/Container/resolveClass.js";

const SRC = fileURLToPath(new URL("../../src", import.meta.url));

async function containerWithFakeStore(saved: Task[]) {
  const container = createContainer({ injectionMode: InjectionMode.CLASSIC, strict: true });

  // Swap the MySQL store for an in-memory fake, like binding a fake in Laravel.
  container.register({
    taskStore: asValue({
      insert: async (task: Task) => {
        saved.push(task);
      },
    }),
  });

  await registerClasses(
    container,
    ["Domain/*/Actions/*.{ts,js}", "Application/Api/*/Controllers/*.{ts,js}"],
    SRC,
  );

  return container;
}

test("auto-registers Actions and Controllers by camelCase class name", async () => {
  const container = await containerWithFakeStore([]);
  const names = Object.keys(container.registrations);

  for (const name of [
    "createTaskAction",
    "updateTaskAction",
    "deleteTaskAction",
    "listTasksController",
    "showTaskController",
    "createTaskController",
    "updateTaskController",
    "deleteTaskController",
  ]) {
    assert.ok(names.includes(name), `${name} should be registered`);
  }
});

test("builds a controller with its whole dependency chain", async () => {
  const saved: Task[] = [];
  const container = await containerWithFakeStore(saved);

  const controller = resolveClass(container, CreateTaskController);
  assert.ok(controller instanceof CreateTaskController);

  // The Action inside was built by the container and received the fake store.
  const action = resolveClass(container, CreateTaskAction);
  await action.execute({ title: "Resolved by the container" });

  assert.equal(saved.length, 1);
  assert.equal(saved[0]?.title, "Resolved by the container");

  // Singletons: every resolve returns the same instance.
  assert.equal(resolveClass(container, CreateTaskAction), action);
});
