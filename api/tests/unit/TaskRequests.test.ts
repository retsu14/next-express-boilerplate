import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";

import { parseCreateTaskRequest } from "../../src/Application/Api/Tasks/Requests/CreateTaskRequest.js";
import { parseTaskIdParameter } from "../../src/Application/Api/Tasks/Requests/TaskIdParameter.js";
import { parseUpdateTaskRequest } from "../../src/Application/Api/Tasks/Requests/UpdateTaskRequest.js";

test("create request maps a valid body to CreateTaskData", () => {
  assert.deepEqual(parseCreateTaskRequest({ title: " Draft " }), {
    title: " Draft ",
  });
});

test("create request rejects missing, non-string and unknown fields", () => {
  assert.throws(() => parseCreateTaskRequest({}), ZodError);
  assert.throws(() => parseCreateTaskRequest({ title: 42 }), ZodError);
  assert.throws(
    () => parseCreateTaskRequest({ title: "ok", completed: true }),
    ZodError,
  );
  assert.throws(() => parseCreateTaskRequest(undefined), ZodError);
});

test("update request keeps completed: false as a real value", () => {
  assert.deepEqual(parseUpdateTaskRequest({ completed: false }), {
    title: undefined,
    completed: false,
  });
});

test("update request rejects an empty body", () => {
  assert.throws(
    () => parseUpdateTaskRequest({}),
    (error: unknown) => {
      assert.ok(error instanceof ZodError);
      assert.match(error.issues[0]?.message ?? "", /at least one field/);
      return true;
    },
  );
});

test("update request rejects nulls and unknown fields", () => {
  assert.throws(() => parseUpdateTaskRequest({ title: null }), ZodError);
  assert.throws(() => parseUpdateTaskRequest({ done: true }), ZodError);
});

test("task id parameter must be a UUID", () => {
  const id = "6f1c2a8e-4f5b-4e1a-9d3c-1b2a3c4d5e6f";

  assert.equal(parseTaskIdParameter({ id }), id);
  assert.throws(() => parseTaskIdParameter({ id: "42" }), ZodError);
});
