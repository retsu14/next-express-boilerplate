/** Turns an unknown thrown value into a message that is safe to display. */
export function describeError(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message.length > 0
    ? cause.message
    : fallback;
}
