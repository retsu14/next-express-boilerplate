import "server-only";

import { publicConfig } from "./publicConfig";

/**
 * Server-only configuration. Importing this module from a Client Component
 * fails the build, which keeps internal addresses out of browser bundles.
 *
 * Inside Docker, API_INTERNAL_URL points at the Compose service name
 * (http://api:4000/api), which only resolves inside the Compose network.
 */
export const serverConfig = {
  apiUrl: process.env.API_INTERNAL_URL ?? publicConfig.apiUrl,
} as const;
