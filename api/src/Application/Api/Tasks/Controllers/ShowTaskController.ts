import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { TaskNotFoundError } from "../../../../Domain/Tasks/Exceptions/TaskNotFoundError.js";
import type { MysqlTaskStore } from "../../../../Domain/Tasks/Persistence/MysqlTaskStore.js";
import { parseTaskIdParameter } from "../Requests/TaskIdParameter.js";
import { toTaskResource } from "../Resources/TaskResource.js";

export class ShowTaskController {
  constructor(
    private readonly taskStore: Pick<MysqlTaskStore, "findById">,
  ) {}

  handle = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = parseTaskIdParameter(req.params);
      const task = await this.taskStore.findById(id);

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
