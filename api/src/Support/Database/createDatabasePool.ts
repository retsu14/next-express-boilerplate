import { createPool, type Pool } from "mysql2/promise";

export type DatabaseConfig = Readonly<{
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}>;

/**
 * Creates a lazy connection pool. No connection is opened until the first
 * query, so the API can start listening while MySQL is still initialising;
 * requests made before MySQL is ready fail through normal error handling.
 *
 * UTC convention: `timezone: "Z"` makes mysql2 write JavaScript Dates as UTC
 * and read DATETIME columns back as UTC.
 */
export function createDatabasePool(config: DatabaseConfig): Pool {
  return createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    timezone: "Z",
    dateStrings: false,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 5_000,
  });
}
