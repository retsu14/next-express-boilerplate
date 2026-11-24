import { asClass, asValue, createContainer, InjectionMode } from "awilix";
import type { Express } from "express";
import type { Pool } from "mysql2/promise";

import { createApp } from "./app.js";
import { MysqlTaskStore } from "./Domain/Tasks/Persistence/MysqlTaskStore.js";
import { registerRoutes } from "./routes.js";
import { registerClasses } from "./Support/Container/registerClasses.js";
import type { ErrorLogger } from "./Support/Http/errorHandler.js";

export type BootstrapOptions = Readonly<{
  frontendOrigin: string;
  pool: Pool;
  logger?: ErrorLogger;
}>;

/**
 * Builds the dependency container and the Express app.
 *
 * Like Laravel's service container, awilix builds classes for you: a
 * constructor parameter named `createTaskAction` receives the registered
 * `createTaskAction` instance, which in turn received its own `taskStore`.
 */
export async function bootstrap(options: BootstrapOptions): Promise<Express> {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  });

  // Explicit bindings: values and implementations the container cannot
  // discover on its own (Laravel: AppServiceProvider::register()).
  container.register({
    pool: asValue(options.pool),
    taskStore: asClass(MysqlTaskStore).singleton(),
  });

  // Auto-registration: every class in these folders, by class name.
  // A new Action or Controller is available as soon as its file exists.
  await registerClasses(
    container,
    [
      "Domain/*/Actions/*.{ts,js}",
      "Application/Api/*/Controllers/*.{ts,js}",
    ],
    import.meta.dirname,
  );

  return createApp({
    frontendOrigin: options.frontendOrigin,
    logger: options.logger ?? console,
    registerRoutes: (app) => registerRoutes(app, container),
  });
}
