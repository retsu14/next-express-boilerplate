import { TaskNotFoundError } from "../Exceptions/TaskNotFoundError.js";
import type { MysqlTaskStore } from "../Persistence/MysqlTaskStore.js";

export class DeleteTaskAction {
  constructor(
    private readonly taskStore: Pick<MysqlTaskStore, "delete">,
  ) {}

  async execute(id: string): Promise<void> {
    // delete() resolves to false when no stored task has this id.
    const deleted = await this.taskStore.delete(id);

    if (!deleted) {
      throw new TaskNotFoundError(id);
    }
  }
}
