import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import request from "supertest";

import { bootstrap } from "../../src/bootstrap.js";
import { clearTasks, createTestPool } from "./testDatabase.js";

const pool = createTestPool();
const app = bootstrap({ frontendOrigin: "http://localhost:3000", pool });

beforeEach(() => clearTasks(pool));
after(() => pool.end());

test("full task lifecycle over HTTP", async () => {
  const created = await request(app)
    .post("/api/tasks")
    .send({ title: "  Write the README  " });

  assert.equal(created.status, 201);
  const task = created.body.data;
  assert.equal(task.title, "Write the README");
  assert.equal(task.completed, false);
  assert.equal(new Date(task.createdAt).toISOString(), task.createdAt);

  const listed = await request(app).get("/api/tasks");
  assert.equal(listed.status, 200);
  assert.deepEqual(listed.body, { data: [task] });

  const shown = await request(app).get(`/api/tasks/${task.id}`);
  assert.deepEqual(shown.body, { data: task });

  const completed = await request(app)
    .patch(`/api/tasks/${task.id}`)
    .send({ completed: true });
  assert.equal(completed.status, 200);
  assert.equal(completed.body.data.completed, true);
  assert.equal(completed.body.data.title, "Write the README");

  const renamed = await request(app)
    .patch(`/api/tasks/${task.id}`)
    .send({ title: "Write the docs" });
  assert.equal(renamed.body.data.title, "Write the docs");
  assert.equal(renamed.body.data.completed, true, "omitted completed is preserved");

  const reopened = await request(app)
    .patch(`/api/tasks/${task.id}`)
    .send({ completed: false });
  assert.equal(reopened.body.data.completed, false);

  const reloaded = await request(app).get(`/api/tasks/${task.id}`);
  assert.equal(reloaded.body.data.completed, false);
  assert.equal(reloaded.body.data.title, "Write the docs");

  const deleted = await request(app).delete(`/api/tasks/${task.id}`);
  assert.equal(deleted.status, 204);
  assert.equal(deleted.text, "");

  const gone = await request(app).get(`/api/tasks/${task.id}`);
  assert.equal(gone.status, 404);
  assert.equal(gone.body.error.code, "TASK_NOT_FOUND");
});

test("missing tasks return 404 for show, update and delete", async () => {
  const id = randomUUID();

  for (const response of [
    await request(app).get(`/api/tasks/${id}`),
    await request(app).patch(`/api/tasks/${id}`).send({ completed: true }),
    await request(app).delete(`/api/tasks/${id}`),
  ]) {
    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, "TASK_NOT_FOUND");
  }
});

test("renaming to an invalid title returns 422 and keeps the task", async () => {
  const created = await request(app).post("/api/tasks").send({ title: "Keep me" });
  const id = created.body.data.id;

  const response = await request(app)
    .patch(`/api/tasks/${id}`)
    .send({ title: "   " });
  assert.equal(response.status, 422);

  const reloaded = await request(app).get(`/api/tasks/${id}`);
  assert.equal(reloaded.body.data.title, "Keep me");
});
