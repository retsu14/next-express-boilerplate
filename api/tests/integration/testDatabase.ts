import type { Pool } from "mysql2/promise";

import { createDatabasePool } from "../../src/Support/Database/createDatabasePool.js";

/**
 * Connects to the dedicated test database named by TEST_DB_NAME.
 * Refuses to run against the development database.
 */
export function createTestPool(env: NodeJS.ProcessEnv = process.env): Pool {
  const testDatabase = env.TEST_DB_NAME;

  if (testDatabase === undefined || testDatabase.length === 0) {
    throw new Error("Set TEST_DB_NAME to run integration tests.");
  }

  if (!testDatabase.endsWith("_test") || testDatabase === env.DB_NAME) {
    throw new Error(
      "TEST_DB_NAME must end with \"_test\" and differ from DB_NAME.",
    );
  }

  return createDatabasePool({
    host: env.DB_HOST ?? "127.0.0.1",
    port: Number(env.DB_PORT ?? 3306),
    user: env.DB_USER ?? "app",
    password: env.DB_PASSWORD ?? "",
    database: testDatabase,
  });
}

export async function clearTasks(pool: Pool): Promise<void> {
  await pool.query("DELETE FROM tasks");
}
