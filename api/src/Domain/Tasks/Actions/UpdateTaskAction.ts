import type { UpdateTaskData } from "../DataTransferObjects/UpdateTaskData.js";
import { TaskNotFoundError } from "../Exceptions/TaskNotFoundError.js";
import type { Task } from "../Models/Task.js";
import type { MysqlTaskStore } from "../Persistence/MysqlTaskStore.js";
import { normalizeTaskTitle } from "../Rules/normalizeTaskTitle.js";

export class UpdateTaskAction {
  constructor(
    private readonly taskStore: Pick<MysqlTaskStore, "findById" | "update">,
  ) {}

  async execute(id: string, data: UpdateTaskData): Promise<Task> {
    // Validate before touching storage so invalid input never causes writes.
    const title = data.title === undefined
      ? undefined
      : normalizeTaskTitle(data.title);

    const existing = await this.taskStore.findById(id);

    if (existing === null) {
      throw new TaskNotFoundError(id);
    }

    if (title === undefined && data.completed === undefined) {
      return existing;
    }

    const updated: Task = {
      ...existing,
      title: title ?? existing.title,
      completed: data.completed ?? existing.completed,
      updatedAt: new Date(),
    };

    // update() resolves to false when no stored task has this id.
    const stored = await this.taskStore.update(updated);

    if (!stored) {
      // The task was deleted between reading and writing it.
      throw new TaskNotFoundError(id);
    }

    return updated;
  }
}
