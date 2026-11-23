import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { TaskNotFoundError } from "../../../../Domain/Tasks/Exceptions/TaskNotFoundError.js";
import type { Task } from "../../../../Domain/Tasks/Models/Task.js";
import { parseTaskIdParameter } from "../Requests/TaskIdParameter.js";
import { toTaskResource } from "../Resources/TaskResource.js";

export class ShowTaskController {
  constructor(
    private readonly findTask: (id: string) => Promise<Task | null>,
  ) {}

  handle = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = parseTaskIdParameter(req.params);
      const task = await this.findTask(id);

      if (task === null) {
        throw new TaskNotFoundError(id);
      }

      res.json({
        data: toTaskResource(task),
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}
