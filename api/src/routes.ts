import type { AwilixContainer } from "awilix";
import type { Express } from "express";

import { createTaskRoutes } from "./Application/Api/Tasks/routes.js";

/**
 * Every endpoint group of the API in one place, like Laravel's
 * routes/api.php. Each feature defines its own endpoints in
 * Application/Api/<Feature>/routes.ts; this file gives each group its
 * URL prefix.
 *
 *   /api/tasks  -> Application/Api/Tasks/routes.ts
 */
export function registerRoutes(app: Express, container: AwilixContainer): void {
  app.use("/api/tasks", createTaskRoutes(container));

  // Add a new feature here, for example:
  // app.use("/api/projects", createProjectRoutes(container));
}
