import type { AwilixContainer } from "awilix";
import type { Express } from "express";

import { CreateTaskController } from "./Application/Api/Tasks/Controllers/CreateTaskController.js";
import { DeleteTaskController } from "./Application/Api/Tasks/Controllers/DeleteTaskController.js";
import { ListTasksController } from "./Application/Api/Tasks/Controllers/ListTasksController.js";
import { ShowTaskController } from "./Application/Api/Tasks/Controllers/ShowTaskController.js";
import { UpdateTaskController } from "./Application/Api/Tasks/Controllers/UpdateTaskController.js";
import { RouteTable, type RegisteredRoute } from "./Support/Http/RouteTable.js";

/**
 * Every API endpoint in one place. All paths below are mounted under /api.
 * Run `npm run route:list` to print them.
 *
 * Each controller is taken from the container with its dependencies already
 * built; Express calls its `handle` method for every matching request.
 */
export function registerRoutes(
  app: Express,
  container: AwilixContainer,
): readonly RegisteredRoute[] {
  const api = new RouteTable(container, "/api");

  // Tasks
  api.get("/tasks", ListTasksController);
  api.post("/tasks", CreateTaskController);
  api.get("/tasks/:id", ShowTaskController);
  api.patch("/tasks/:id", UpdateTaskController);
  api.delete("/tasks/:id", DeleteTaskController);

  // Add new endpoints here, for example:
  // api.get("/projects", ListProjectsController);

  api.mount(app);

  return api.routes;
}
