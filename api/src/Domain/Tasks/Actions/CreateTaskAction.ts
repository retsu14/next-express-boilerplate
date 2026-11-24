import { randomUUID } from "node:crypto";

import type { CreateTaskData } from "../DataTransferObjects/CreateTaskData.js";
import type { Task } from "../Models/Task.js";
import type { MysqlTaskStore } from "../Persistence/MysqlTaskStore.js";
import { normalizeTaskTitle } from "../Rules/normalizeTaskTitle.js";

export class CreateTaskAction {
  /**
   * Resolved by the container: the parameter name `taskStore` is the
   * registration name. The type asks only for the method this Action uses,
   * so tests can pass a small fake.
   */
  constructor(
    private readonly taskStore: Pick<MysqlTaskStore, "insert">,
  ) {}

  async execute(data: CreateTaskData): Promise<Task> {
    const title = normalizeTaskTitle(data.title);
    const now = new Date();

    const task: Task = {
      id: randomUUID(),
      title,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    await this.taskStore.insert(task);

    return task;
  }
}
