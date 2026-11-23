import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type { Task } from "../../../../Domain/Tasks/Models/Task.js";
import { toTaskResource } from "../Resources/TaskResource.js";

export class ListTasksController {
  constructor(
    private readonly listTasks: () => Promise<Task[]>,
  ) {}

  handle = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tasks = await this.listTasks();

      res.json({
        data: tasks.map(toTaskResource),
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}
