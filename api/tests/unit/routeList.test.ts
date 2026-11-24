import { after, test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";

import { createApp } from "../../src/app.js";
import { filterRoutes, formatRouteList } from "../../src/Application/Console/RouteList/formatRouteList.js";
import { buildContainer } from "../../src/bootstrap.js";
import { registerRoutes } from "../../src/routes.js";
import { createDatabasePool } from "../../src/Support/Database/createDatabasePool.js";
import type { RegisteredRoute } from "../../src/Support/Http/RouteTable.js";

// Lazy pool pointed at a closed port: building routes must not touch MySQL.
const pool = createDatabasePool({
  host: "127.0.0.1",
  port: 1,
  user: "nobody",
  password: "",
  database: "unreachable",
});

after(() => pool.end());

const SAMPLE: RegisteredRoute[] = [
  { method: "GET", path: "/api/tasks", controller: "ListTasksController" },
  { method: "POST", path: "/api/tasks", controller: "CreateTaskController" },
  { method: "DELETE", path: "/api/tasks/:id", controller: "DeleteTaskController" },
];

test("registerRoutes reports every Tasks endpoint with its controller", async () => {
  const routes = registerRoutes(express(), await buildContainer(pool));

  assert.deepEqual(routes, [
    { method: "GET", path: "/api/tasks", controller: "ListTasksController" },
    { method: "POST", path: "/api/tasks", controller: "CreateTaskController" },
    { method: "GET", path: "/api/tasks/:id", controller: "ShowTaskController" },
    { method: "PATCH", path: "/api/tasks/:id", controller: "UpdateTaskController" },
    { method: "DELETE", path: "/api/tasks/:id", controller: "DeleteTaskController" },
  ]);
});

test("every listed route is actually served, and GET also answers HEAD", async () => {
  const container = await buildContainer(pool);
  const app = createApp({
    frontendOrigin: "http://localhost:3000",
    logger: { error: () => {} },
    registerRoutes: (target) => registerRoutes(target, container),
  });

  // A 400 for a malformed id proves the route matched and reached its controller.
  const id = "not-a-uuid";
  assert.equal((await request(app).get(`/api/tasks/${id}`)).status, 400);
  assert.equal((await request(app).head(`/api/tasks/${id}`)).status, 400);
  assert.equal((await request(app).patch(`/api/tasks/${id}`).send({ completed: true })).status, 400);
  assert.equal((await request(app).delete(`/api/tasks/${id}`)).status, 400);
  assert.equal((await request(app).post("/api/tasks").send({})).status, 400);
});

test("formats one plain-text line per route, with a count", () => {
  const output = formatRouteList(SAMPLE);
  const lines = output.split("\n");

  assert.equal(lines[0], "METHOD    PATH            CONTROLLER");
  assert.equal(lines[1], "GET|HEAD  /api/tasks      ListTasksController");
  assert.equal(lines[3], "DELETE    /api/tasks/:id  DeleteTaskController");
  assert.match(output, /Showing 3 routes\.\n$/);
  // Only printable ASCII and newlines: safe for grep and findstr.
  assert.match(output, /^[\x20-\x7E\n]*$/);
});

test("filters by method (GET includes HEAD) and by path", () => {
  assert.deepEqual(
    filterRoutes(SAMPLE, { method: "head" }).map((route) => route.controller),
    ["ListTasksController"],
  );
  assert.deepEqual(
    filterRoutes(SAMPLE, { path: ":ID" }).map((route) => route.controller),
    ["DeleteTaskController"],
  );
  assert.deepEqual(filterRoutes(SAMPLE, { method: "PUT" }), []);
  assert.equal(formatRouteList([]), "No matching routes.\n");
});
