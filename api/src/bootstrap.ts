import {
  asClass,
  asValue,
  createContainer,
  InjectionMode,
  type AwilixContainer,
} from "awilix";
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
 * The awilix container builds classes for you: a constructor parameter
 * named `createTaskAction` receives the registered `createTaskAction`
 * instance, which in turn received its own `taskStore`.
 */
export async function bootstrap(options: BootstrapOptions): Promise<Express> {
  const container = await buildContainer(options.pool);

  return createApp({
    frontendOrigin: options.frontendOrigin,
    logger: options.logger ?? console,
    registerRoutes: (app) => registerRoutes(app, container),
  });
}

/**
 * The dependency container on its own, without the Express app. Shared by
 * the HTTP server and console commands such as `npm run route:list`.
 */
export async function buildContainer(pool: Pool): Promise<AwilixContainer> {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  });

  // Explicit bindings: values and implementations the container cannot
  // discover on its own.
  container.register({
    pool: asValue(pool),
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

  return container;
}
