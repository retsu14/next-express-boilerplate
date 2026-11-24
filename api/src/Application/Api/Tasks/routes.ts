import type { AwilixContainer } from "awilix";
import { Router } from "express";

import { resolveClass } from "../../../Support/Container/resolveClass.js";
import { CreateTaskController } from "./Controllers/CreateTaskController.js";
import { DeleteTaskController } from "./Controllers/DeleteTaskController.js";
import { ListTasksController } from "./Controllers/ListTasksController.js";
import { ShowTaskController } from "./Controllers/ShowTaskController.js";
import { UpdateTaskController } from "./Controllers/UpdateTaskController.js";

/**
 * The endpoints of the Tasks feature, mounted under /api/tasks by
 * src/routes.ts. Controllers come from the container with all their
 * dependencies already built, like `[ListTasksController::class, 'handle']`
 * in Laravel.
 */
export function createTaskRoutes(container: AwilixContainer): Router {
  const router = Router();
  const controller = <T>(Class: abstract new (...args: never[]) => T): T =>
    resolveClass(container, Class);

  router.get("/", controller(ListTasksController).handle);
  router.post("/", controller(CreateTaskController).handle);
  router.get("/:id", controller(ShowTaskController).handle);
  router.patch("/:id", controller(UpdateTaskController).handle);
  router.delete("/:id", controller(DeleteTaskController).handle);

  return router;
}
