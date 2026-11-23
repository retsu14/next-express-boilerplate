import { Router } from "express";

import type { CreateTaskController } from "./Controllers/CreateTaskController.js";
import type { DeleteTaskController } from "./Controllers/DeleteTaskController.js";
import type { ListTasksController } from "./Controllers/ListTasksController.js";
import type { ShowTaskController } from "./Controllers/ShowTaskController.js";
import type { UpdateTaskController } from "./Controllers/UpdateTaskController.js";

export type TaskControllers = Readonly<{
  list: ListTasksController;
  show: ShowTaskController;
  create: CreateTaskController;
  update: UpdateTaskController;
  delete: DeleteTaskController;
}>;

export function createTaskRoutes(controllers: TaskControllers): Router {
  const router = Router();

  router.get("/", controllers.list.handle);
  router.post("/", controllers.create.handle);
  router.get("/:id", controllers.show.handle);
  router.patch("/:id", controllers.update.handle);
  router.delete("/:id", controllers.delete.handle);

  return router;
}
