import { InvalidTaskTitleError } from "../Exceptions/InvalidTaskTitleError.js";

export const MAX_TASK_TITLE_LENGTH = 200;

export function normalizeTaskTitle(value: string): string {
  const title = value.trim();

  if (title.length === 0 || title.length > MAX_TASK_TITLE_LENGTH) {
    throw new InvalidTaskTitleError();
  }

  return title;
}
