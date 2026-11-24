import type { AwilixContainer } from "awilix";
import { Router, type Express, type RequestHandler } from "express";

import { resolveClass } from "../Container/resolveClass.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** One line of `npm run route:list`. */
export type RegisteredRoute = Readonly<{
  method: HttpMethod;
  path: string;
  controller: string;
}>;

// Controllers expose `handle` with request types narrowed per endpoint;
// `any` here lets each controller keep its own narrow types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Controller = { handle: RequestHandler<any, any, any> };
type ControllerClass = abstract new (...args: never[]) => Controller;

/**
 * Registers routes on an Express router and remembers each one, so the
 * route list can be printed later. Express itself cannot reliably report
 * the full paths of routes inside mounted routers.
 *
 *   const api = new RouteTable(container, "/api");
 *   api.get("/tasks", ListTasksController);
 *   api.mount(app);
 */
export class RouteTable {
  private readonly router = Router();
  private readonly registered: RegisteredRoute[] = [];

  constructor(
    private readonly container: AwilixContainer,
    private readonly prefix: string,
  ) {}

  get(path: string, Controller: ControllerClass): this {
    return this.add("GET", path, Controller);
  }

  post(path: string, Controller: ControllerClass): this {
    return this.add("POST", path, Controller);
  }

  put(path: string, Controller: ControllerClass): this {
    return this.add("PUT", path, Controller);
  }

  patch(path: string, Controller: ControllerClass): this {
    return this.add("PATCH", path, Controller);
  }

  delete(path: string, Controller: ControllerClass): this {
    return this.add("DELETE", path, Controller);
  }

  /** Attaches every route to the app under the table's prefix. */
  mount(app: Express): void {
    app.use(this.prefix, this.router);
  }

  /** Routes in the order they were added, which is also matching order. */
  get routes(): readonly RegisteredRoute[] {
    return this.registered;
  }

  private add(method: HttpMethod, path: string, Controller: ControllerClass): this {
    // Resolving here means a missing dependency fails at startup.
    const controller = resolveClass(this.container, Controller);

    switch (method) {
      case "GET": this.router.get(path, controller.handle); break;
      case "POST": this.router.post(path, controller.handle); break;
      case "PUT": this.router.put(path, controller.handle); break;
      case "PATCH": this.router.patch(path, controller.handle); break;
      case "DELETE": this.router.delete(path, controller.handle); break;
    }

    this.registered.push({
      method,
      path: joinPaths(this.prefix, path),
      controller: Controller.name,
    });

    return this;
  }
}

function joinPaths(prefix: string, path: string): string {
  const joined = `${prefix.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  return joined.length > 1 ? joined.replace(/\/+$/, "") : joined;
}
