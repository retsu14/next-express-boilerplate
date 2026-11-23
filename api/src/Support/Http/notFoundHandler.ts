import type { Request, Response } from "express";

import { sendError } from "./sendError.js";

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(
    res,
    404,
    "ROUTE_NOT_FOUND",
    "The requested endpoint does not exist.",
  );
}
