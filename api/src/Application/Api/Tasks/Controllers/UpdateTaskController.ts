import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type { UpdateTaskAction } from "../../../../Domain/Tasks/Actions/UpdateTaskAction.js";
import { parseTaskIdParameter } from "../Requests/TaskIdParameter.js";
import { parseUpdateTaskRequest } from "../Requests/UpdateTaskRequest.js";
import { toTaskResource } from "../Resources/TaskResource.js";

export class UpdateTaskController {
  constructor(
    private readonly updateTaskAction: UpdateTaskAction,
  ) {}

  handle = async (
    req: Request<{ id: string }, unknown, unknown>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = parseTaskIdParameter(req.params);
      const input = parseUpdateTaskRequest(req.body);
      const task = await this.updateTaskAction.execute(id, input);

      res.json({
        data: toTaskResource(task),
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}
