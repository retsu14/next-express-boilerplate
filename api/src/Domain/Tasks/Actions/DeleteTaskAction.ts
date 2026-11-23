import { TaskNotFoundError } from "../Exceptions/TaskNotFoundError.js";

export class DeleteTaskAction {
  constructor(
    /** Resolves to false when no stored task has the given id. */
    private readonly deleteTask: (id: string) => Promise<boolean>,
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.deleteTask(id);

    if (!deleted) {
      throw new TaskNotFoundError(id);
    }
  }
}
