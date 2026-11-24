import { pathToFileURL } from "node:url";

import { asClass, listModules, type AwilixContainer } from "awilix";

import { containerName } from "./containerName.js";

/**
 * Auto-registration: new classes become injectable just by living in a
 * matching folder, with no registration code to write.
 *
 * Finds the files matching `patterns` (relative to `cwd`), imports them and
 * registers every exported class under its camelCase class name as a
 * singleton: `export class CreateTaskAction` becomes `createTaskAction`.
 *
 * Patterns should match both `.ts` (development with tsx) and `.js`
 * (compiled output in dist/), e.g. "Domain/*\/Actions/*.{ts,js}".
 */
export async function registerClasses(
  container: AwilixContainer,
  patterns: string[],
  cwd: string,
): Promise<void> {
  for (const module of listModules(patterns, { cwd })) {
    const exports: Record<string, unknown> = await import(
      pathToFileURL(module.path).href
    );

    for (const exported of Object.values(exports)) {
      if (isClass(exported)) {
        container.register(
          containerName(exported),
          asClass(exported).singleton(),
        );
      }
    }
  }
}

// Matches awilix's own Constructor type, which accepts any arguments.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClass = new (...args: any[]) => object;

function isClass(value: unknown): value is AnyClass {
  return typeof value === "function"
    && /^class[\s{]/.test(Function.prototype.toString.call(value));
}
