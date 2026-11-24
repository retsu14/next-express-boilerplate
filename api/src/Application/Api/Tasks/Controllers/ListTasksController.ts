import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type { MysqlTaskStore } from "../../../../Domain/Tasks/Persistence/MysqlTaskStore.js";
import { toTaskResource } from "../Resources/TaskResource.js";

export class ListTasksController {
  constructor(
    private readonly taskStore: Pick<MysqlTaskStore, "findAll">,
  ) {}

  handle = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tasks = await this.taskStore.findAll();

      res.json({
        data: tasks.map(toTaskResource),
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}
