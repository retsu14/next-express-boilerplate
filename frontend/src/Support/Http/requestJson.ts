import { z } from "zod";

import { ApiRequestError } from "./ApiRequestError";

const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

/**
 * Sends a JSON request and returns the parsed body as `unknown`; callers are
 * expected to validate it. Failures throw an ApiRequestError whose message
 * comes from the API's error contract when one is present.
 */
export async function requestJson(
  url: string,
  init: RequestInit = {},
): Promise<unknown> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch {
    throw new ApiRequestError(0, "NETWORK_ERROR", "Unable to reach the API.");
  }

  if (!response.ok) {
    throw await toApiRequestError(response);
  }

  if (response.status === 204) {
    return undefined;
  }

  try {
    return await response.json();
  } catch {
    throw new ApiRequestError(
      response.status,
      "INVALID_JSON",
      "The API returned invalid JSON.",
    );
  }
}

async function toApiRequestError(response: Response): Promise<ApiRequestError> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  const parsed = errorResponseSchema.safeParse(body);

  if (parsed.success) {
    return new ApiRequestError(
      response.status,
      parsed.data.error.code,
      parsed.data.error.message,
    );
  }

  return new ApiRequestError(
    response.status,
    "HTTP_ERROR",
    `The request failed with status ${response.status}.`,
  );
}
