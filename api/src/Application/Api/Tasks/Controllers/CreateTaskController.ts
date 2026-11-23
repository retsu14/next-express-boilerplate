import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type { CreateTaskAction } from "../../../../Domain/Tasks/Actions/CreateTaskAction.js";
import { parseCreateTaskRequest } from "../Requests/CreateTaskRequest.js";
import { toTaskResource } from "../Resources/TaskResource.js";

export class CreateTaskController {
  constructor(
    private readonly createTask: CreateTaskAction,
  ) {}

  handle = async (
    req: Request<Record<string, never>, unknown, unknown>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const input = parseCreateTaskRequest(req.body);
      const task = await this.createTask.execute(input);

      res.status(201).json({
        data: toTaskResource(task),
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}
