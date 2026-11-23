/**
 * Fields that are omitted (undefined) keep their current value.
 * `completed: false` is a real change, not an omission.
 */
export type UpdateTaskData = Readonly<{
  title?: string | undefined;
  completed?: boolean | undefined;
}>;
