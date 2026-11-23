import { randomUUID } from "node:crypto";

import type { CreateTaskData } from "../DataTransferObjects/CreateTaskData.js";
import type { Task } from "../Models/Task.js";
import { normalizeTaskTitle } from "../Rules/normalizeTaskTitle.js";

export class CreateTaskAction {
  constructor(
    private readonly saveTask: (task: Task) => Promise<void>,
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

    await this.saveTask(task);

    return task;
  }
}
