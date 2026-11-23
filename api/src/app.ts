import cors from "cors";
import express, { type Express } from "express";

import { createErrorHandler, type ErrorLogger } from "./Support/Http/errorHandler.js";
import { notFoundHandler } from "./Support/Http/notFoundHandler.js";

export type AppOptions = Readonly<{
  frontendOrigin: string;
  logger: ErrorLogger;
  registerRoutes: (app: Express) => void;
}>;

/**
 * Builds the Express application without starting a listener, so tests can
 * exercise it in-process.
 */
export function createApp(options: AppOptions): Express {
  const app = express();

  app.disable("x-powered-by");

  app.use(cors({
    origin: options.frontendOrigin,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Accept"],
  }));

  app.use(express.json({ limit: "100kb" }));

  options.registerRoutes(app);

  app.use(notFoundHandler);
  app.use(createErrorHandler(options.logger));

  return app;
}
