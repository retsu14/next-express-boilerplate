export class InvalidTaskTitleError extends Error {
  constructor() {
    super("Task titles must contain between 1 and 200 characters.");
    this.name = "InvalidTaskTitleError";
  }
}
