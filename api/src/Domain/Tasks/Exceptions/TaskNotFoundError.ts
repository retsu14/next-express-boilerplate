export class TaskNotFoundError extends Error {
  constructor(readonly taskId: string) {
    super("The requested task does not exist.");
    this.name = "TaskNotFoundError";
  }
}
