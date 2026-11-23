import { z } from "zod";

import type { DatabaseConfig } from "../Database/createDatabasePool.js";

export type AppConfig = Readonly<{
  host: string;
  port: number;
  frontendOrigin: string;
  database: DatabaseConfig;
}>;

const portSchema = z.coerce.number().int().min(1).max(65535);

const environmentSchema = z.object({
  HOST: z.string().min(1).default("0.0.0.0"),
  PORT: portSchema.default(4000),
  FRONTEND_ORIGIN: z.url().default("http://localhost:3000"),
  DB_HOST: z.string().min(1),
  DB_PORT: portSchema.default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().min(1),
});

/**
 * Reads configuration from environment variables. Error messages name the
 * invalid variables but never include their values.
 */
export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AppConfig {
  const parsed = environmentSchema.safeParse(environment);

  if (!parsed.success) {
    const names = [
      ...new Set(parsed.error.issues.map((issue) => String(issue.path[0]))),
    ];

    throw new Error(
      `Invalid or missing environment variables: ${names.join(", ")}.`,
    );
  }

  const env = parsed.data;

  return {
    host: env.HOST,
    port: env.PORT,
    frontendOrigin: new URL(env.FRONTEND_ORIGIN).origin,
    database: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
    },
  };
}
