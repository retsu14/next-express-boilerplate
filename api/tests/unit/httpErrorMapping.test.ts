import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { bootstrap } from "../../src/bootstrap.js";
import { createDatabasePool } from "../../src/Support/Database/createDatabasePool.js";

/*
 * These tests run the real application without MySQL. The pool is lazy and
 * points at a closed local port, so validation failures are answered before
 * any query, and anything that does reach the database fails like an outage.
 */
const DB_PASSWORD = "unit-test-secret";
const FRONTEND_ORIGIN = "http://localhost:3000";
const TASK_ID = "6f1c2a8e-4f5b-4e1a-9d3c-1b2a3c4d5e6f";

const pool = createDatabasePool({
  host: "127.0.0.1",
  port: 1,
  user: "nobody",
  password: DB_PASSWORD,
  database: "unreachable",
});

const loggedErrors: Array<Record<string, unknown>> = [];

const app = await bootstrap({
  frontendOrigin: FRONTEND_ORIGIN,
  pool,
  logger: {
    error: (_message, details) => {
      loggedErrors.push(details);
    },
  },
});

after(async () => {
  await pool.end();
});

describe("request validation", () => {
  test("malformed JSON returns 400 MALFORMED_JSON", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .set("Content-Type", "application/json")
      .send("{\"title\":");

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "MALFORMED_JSON");
  });

  test("missing title returns 400 VALIDATION_FAILED", async () => {
    const response = await request(app).post("/api/tasks").send({});

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "VALIDATION_FAILED");
    assert.match(response.body.error.message, /^title: /);
  });

  test("unknown fields return 400", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send({ title: "Valid", completed: true });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "VALIDATION_FAILED");
  });

  test("a blank title returns 422 INVALID_TASK_TITLE", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send({ title: "    " });

    assert.equal(response.status, 422);
    assert.deepEqual(response.body, {
      error: {
        code: "INVALID_TASK_TITLE",
        message: "Task titles must contain between 1 and 200 characters.",
      },
    });
  });

  test("an oversized title returns 422", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send({ title: "a".repeat(201) });

    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, "INVALID_TASK_TITLE");
  });

  test("an empty PATCH body returns 400", async () => {
    const response = await request(app)
      .patch(`/api/tasks/${TASK_ID}`)
      .send({});

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "VALIDATION_FAILED");
  });

  test("a non-UUID id returns 400", async () => {
    const response = await request(app).get("/api/tasks/not-a-uuid");

    assert.equal(response.status, 400);
    assert.equal(response.body.error.message, "id: The task id must be a UUID.");
  });
});

describe("routing and CORS", () => {
  test("unknown routes return a JSON 404", async () => {
    const response = await request(app).get("/api/unknown");

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, "ROUTE_NOT_FOUND");
  });

  test("CORS allows only the configured frontend origin", async () => {
    const allowed = await request(app)
      .options("/api/tasks")
      .set("Origin", FRONTEND_ORIGIN)
      .set("Access-Control-Request-Method", "PATCH");

    assert.equal(allowed.headers["access-control-allow-origin"], FRONTEND_ORIGIN);
    assert.match(String(allowed.headers["access-control-allow-methods"]), /PATCH/);

    const other = await request(app)
      .get("/api/unknown")
      .set("Origin", "http://evil.example");

    assert.notEqual(other.headers["access-control-allow-origin"], "http://evil.example");
  });
});

describe("unexpected failures", () => {
  test("a database outage returns a safe 500 and is logged server-side", async () => {
    loggedErrors.length = 0;

    const response = await request(app).get("/api/tasks");

    assert.equal(response.status, 500);
    assert.deepEqual(response.body, {
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again later.",
      },
    });

    const raw = JSON.stringify(response.body);
    assert.doesNotMatch(raw, /127\.0\.0\.1|ECONNREFUSED|stack|unreachable/);

    assert.equal(loggedErrors.length, 1);
    assert.doesNotMatch(JSON.stringify(loggedErrors), new RegExp(DB_PASSWORD));
  });
});
