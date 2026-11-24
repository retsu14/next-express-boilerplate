import test from "node:test";
import assert from "node:assert/strict";

import { CreateTaskAction } from "../../src/Domain/Tasks/Actions/CreateTaskAction.js";
import { InvalidTaskTitleError } from "../../src/Domain/Tasks/Exceptions/InvalidTaskTitleError.js";
import type { Task } from "../../src/Domain/Tasks/Models/Task.js";

test("trims the title and creates an incomplete task", async () => {
  const savedTasks: Task[] = [];

  const action = new CreateTaskAction({
    insert: async (task) => {
      savedTasks.push(task);
    },
  });

  const task = await action.execute({
    title: "  Learn domain-oriented architecture  ",
  });

  assert.equal(task.title, "Learn domain-oriented architecture");
  assert.equal(task.completed, false);
  assert.equal(task.createdAt.getTime(), task.updatedAt.getTime());
  assert.match(task.id, /^[0-9a-f-]{36}$/);
  assert.equal(savedTasks.length, 1);
  assert.equal(savedTasks[0]?.id, task.id);
});

test("rejects a blank title without writing to storage", async () => {
  let writes = 0;

  const action = new CreateTaskAction({
    insert: async () => {
      writes += 1;
    },
  });

  await assert.rejects(
    action.execute({ title: "   " }),
    InvalidTaskTitleError,
  );

  assert.equal(writes, 0);
});

test("accepts exactly 200 characters and rejects 201", async () => {
  let writes = 0;

  const action = new CreateTaskAction({
    insert: async () => {
      writes += 1;
    },
  });

  const task = await action.execute({ title: ` ${"a".repeat(200)} ` });
  assert.equal(task.title.length, 200);

  await assert.rejects(
    action.execute({ title: "a".repeat(201) }),
    InvalidTaskTitleError,
  );

  assert.equal(writes, 1);
});
