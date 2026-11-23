import type { Express } from "express";
import type { Pool } from "mysql2/promise";

import { createApp } from "./app.js";
import { CreateTaskController } from "./Application/Api/Tasks/Controllers/CreateTaskController.js";
import { DeleteTaskController } from "./Application/Api/Tasks/Controllers/DeleteTaskController.js";
import { ListTasksController } from "./Application/Api/Tasks/Controllers/ListTasksController.js";
import { ShowTaskController } from "./Application/Api/Tasks/Controllers/ShowTaskController.js";
import { UpdateTaskController } from "./Application/Api/Tasks/Controllers/UpdateTaskController.js";
import { createTaskRoutes } from "./Application/Api/Tasks/routes.js";
import { CreateTaskAction } from "./Domain/Tasks/Actions/CreateTaskAction.js";
import { DeleteTaskAction } from "./Domain/Tasks/Actions/DeleteTaskAction.js";
import { UpdateTaskAction } from "./Domain/Tasks/Actions/UpdateTaskAction.js";
import { MysqlTaskStore } from "./Domain/Tasks/Persistence/MysqlTaskStore.js";
import type { ErrorLogger } from "./Support/Http/errorHandler.js";

export type BootstrapOptions = Readonly<{
  frontendOrigin: string;
  pool: Pool;
  logger?: ErrorLogger;
}>;

/**
 * Composition root: the only place that knows how stores, actions and
 * controllers are connected.
 */
export function bootstrap(options: BootstrapOptions): Express {
  const taskStore = new MysqlTaskStore(options.pool);

  const createTaskAction = new CreateTaskAction(
    (task) => taskStore.insert(task),
  );

  const updateTaskAction = new UpdateTaskAction(
    (id) => taskStore.findById(id),
    (task) => taskStore.update(task),
  );

  const deleteTaskAction = new DeleteTaskAction(
    (id) => taskStore.delete(id),
  );

  const taskRoutes = createTaskRoutes({
    list: new ListTasksController(() => taskStore.findAll()),
    show: new ShowTaskController((id) => taskStore.findById(id)),
    create: new CreateTaskController(createTaskAction),
    update: new UpdateTaskController(updateTaskAction),
    delete: new DeleteTaskController(deleteTaskAction),
  });

  return createApp({
    frontendOrigin: options.frontendOrigin,
    logger: options.logger ?? console,
    registerRoutes(app) {
      app.use("/api/tasks", taskRoutes);
    },
  });
}
