/**
 * The container name of a class: its name with a lowercase first letter.
 * CreateTaskAction -> "createTaskAction".
 *
 * Constructor parameters must use this name to receive the instance, e.g.
 * `constructor(private readonly createTaskAction: CreateTaskAction)`.
 */
export function containerName(Class: { name: string }): string {
  return Class.name.charAt(0).toLowerCase() + Class.name.slice(1);
}
