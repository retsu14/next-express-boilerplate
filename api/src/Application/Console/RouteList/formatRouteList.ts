import type { RegisteredRoute } from "../../../Support/Http/RouteTable.js";

export type RouteListFilters = Readonly<{
  method?: string | undefined;
  path?: string | undefined;
}>;

/**
 * Keeps routes whose method matches `method` (case-insensitive, GET also
 * matches HEAD) and whose path contains `path`.
 */
export function filterRoutes(
  routes: readonly RegisteredRoute[],
  filters: RouteListFilters,
): RegisteredRoute[] {
  const method = filters.method?.toUpperCase();
  const path = filters.path?.toLowerCase();

  return routes.filter((route) =>
    (method === undefined || displayMethod(route).split("|").includes(method))
    && (path === undefined || route.path.toLowerCase().includes(path)));
}

/**
 * Plain-text table: one route per line, columns padded with spaces, no
 * colours or box characters, so every line survives grep and findstr.
 */
export function formatRouteList(routes: readonly RegisteredRoute[]): string {
  if (routes.length === 0) {
    return "No matching routes.\n";
  }

  const rows = [
    ["METHOD", "PATH", "CONTROLLER"],
    ...routes.map((route) => [displayMethod(route), route.path, route.controller]),
  ];

  const widths = [0, 1].map((column) =>
    Math.max(...rows.map((row) => row[column]?.length ?? 0)));

  const lines = rows.map(([method = "", path = "", controller = ""]) =>
    `${method.padEnd(widths[0] ?? 0)}  ${path.padEnd(widths[1] ?? 0)}  ${controller}`);

  const count = routes.length === 1 ? "1 route" : `${routes.length} routes`;

  return `${lines.join("\n")}\n\nShowing ${count}.\n`;
}

/** Express answers HEAD requests with the matching GET route. */
function displayMethod(route: RegisteredRoute): string {
  return route.method === "GET" ? "GET|HEAD" : route.method;
}
