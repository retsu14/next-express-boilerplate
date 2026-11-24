import type { AwilixContainer } from "awilix";

import { containerName } from "./containerName.js";

/**
 * Resolves a registered class from the container by passing the class
 * itself instead of its string name, so typos are caught by TypeScript.
 * Throws at startup if the class was never registered.
 */
export function resolveClass<T>(
  container: AwilixContainer,
  Class: abstract new (...args: never[]) => T,
): T {
  return container.resolve<T>(containerName(Class));
}
