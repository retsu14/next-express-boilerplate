import { bootstrap } from "./bootstrap.js";
import { loadConfig } from "./Support/Config/loadConfig.js";
import { createDatabasePool } from "./Support/Database/createDatabasePool.js";

const config = loadConfig();
const pool = createDatabasePool(config.database);

const app = await bootstrap({
  frontendOrigin: config.frontendOrigin,
  pool,
});

const server = app.listen(config.port, config.host, () => {
  console.log(`API listening on http://${config.host}:${config.port}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down.`);

  server.close(() => {
    pool.end()
      .catch((error: unknown) => {
        console.error("Failed to close the database pool.", error);
      })
      .finally(() => process.exit(0));
  });
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
