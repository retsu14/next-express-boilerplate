/**
 * Prints every API route.
 *
 *   npm run route:list
 *   npm run route:list -- --method=GET
 *   npm run route:list -- --path=tasks
 *   npm run route:list -- --json
 *
 * Output is plain text, one route per line, so it can be piped to
 * `grep` (Linux/macOS/Git Bash) or `findstr` (Windows). Add `-s` to npm
 * (`npm run -s route:list`) to hide npm's own header lines.
 */
import { parseArgs } from "node:util";

import express from "express";

import { buildContainer } from "../../../bootstrap.js";
import { registerRoutes } from "../../../routes.js";
import { createDatabasePool } from "../../../Support/Database/createDatabasePool.js";
import { filterRoutes, formatRouteList } from "./formatRouteList.js";

const USAGE = "Usage: npm run route:list -- [--method=GET] [--path=tasks] [--json]";

let options: { method?: string | undefined; path?: string | undefined; json: boolean };

try {
  const { values } = parseArgs({
    options: {
      method: { type: "string" },
      path: { type: "string" },
      json: { type: "boolean", default: false },
    },
  });
  options = values;
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(USAGE);
  process.exit(1);
}

// Listing routes runs no queries. The pool is lazy and never connects, so
// this works without a database or any DB_* environment variables.
const pool = createDatabasePool({
  host: "127.0.0.1",
  port: 3306,
  user: "route-list",
  password: "",
  database: "route-list",
});

try {
  const container = await buildContainer(pool);
  const routes = filterRoutes(registerRoutes(express(), container), options);

  process.stdout.write(
    options.json ? `${JSON.stringify(routes, null, 2)}\n` : formatRouteList(routes),
  );
} finally {
  await pool.end();
}
