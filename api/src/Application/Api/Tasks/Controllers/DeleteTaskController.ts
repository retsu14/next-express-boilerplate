import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type { DeleteTaskAction } from "../../../../Domain/Tasks/Actions/DeleteTaskAction.js";
import { parseTaskIdParameter } from "../Requests/TaskIdParameter.js";

export class DeleteTaskController {
  constructor(
    private readonly deleteTask: DeleteTaskAction,
  ) {}

  handle = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = parseTaskIdParameter(req.params);
      await this.deleteTask.execute(id);

      res.status(204).end();
    } catch (error: unknown) {
      next(error);
    }
  };
}
