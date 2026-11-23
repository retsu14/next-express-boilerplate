import type { Response } from "express";

export type ErrorBody = Readonly<{
  error: Readonly<{
    code: string;
    message: string;
  }>;
}>;

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
): void {
  const body: ErrorBody = { error: { code, message } };

  res.status(status).json(body);
}
