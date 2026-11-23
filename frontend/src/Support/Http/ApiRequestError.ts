/**
 * A failed API request. `status` is 0 when the API could not be reached.
 * `message` is always safe to show to users.
 */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}
