import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import { ZodError } from "zod";

import { InvalidTaskTitleError } from "../../Domain/Tasks/Exceptions/InvalidTaskTitleError.js";
import { TaskNotFoundError } from "../../Domain/Tasks/Exceptions/TaskNotFoundError.js";
import { sendError } from "./sendError.js";

export type ErrorLogger = Readonly<{
  error: (message: string, details: Record<string, unknown>) => void;
}>;

/**
 * Maps known failures to the API error contract. Anything unexpected becomes
 * a generic 500; details are logged server-side only and never returned.
 */
export function createErrorHandler(logger: ErrorLogger): ErrorRequestHandler {
  return (
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof ZodError) {
      sendError(res, 400, "VALIDATION_FAILED", describeValidationError(error));
      return;
    }

    if (error instanceof InvalidTaskTitleError) {
      sendError(res, 422, "INVALID_TASK_TITLE", error.message);
      return;
    }

    if (error instanceof TaskNotFoundError) {
      sendError(res, 404, "TASK_NOT_FOUND", error.message);
      return;
    }

    const bodyParserType = getBodyParserErrorType(error);

    if (bodyParserType === "entity.parse.failed") {
      sendError(res, 400, "MALFORMED_JSON", "The request body is not valid JSON.");
      return;
    }

    if (bodyParserType === "entity.too.large") {
      sendError(res, 413, "PAYLOAD_TOO_LARGE", "The request body is too large.");
      return;
    }

    logger.error("Unexpected error while handling a request.", {
      method: req.method,
      path: req.path,
      ...describeUnexpectedError(error),
    });

    sendError(
      res,
      500,
      "INTERNAL_ERROR",
      "Something went wrong. Please try again later.",
    );
  };
}

function describeValidationError(error: ZodError): string {
  const issue = error.issues[0];

  if (issue === undefined) {
    return "The request is invalid.";
  }

  const field = issue.path.map(String).join(".");

  return field.length > 0 ? `${field}: ${issue.message}` : issue.message;
}

function getBodyParserErrorType(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "type" in error) {
    const { type } = error as { type: unknown };

    return typeof type === "string" ? type : undefined;
  }

  return undefined;
}

/**
 * Picks safe diagnostic fields only. mysql2 errors carry an `sql` property
 * that can include parameter values, so it is deliberately not logged.
 */
function describeUnexpectedError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return { error: String(error) };
  }

  const code = (error as { code?: unknown }).code;

  return {
    name: error.name,
    message: error.message,
    ...(typeof code === "string" ? { code } : {}),
    stack: error.stack,
  };
}
