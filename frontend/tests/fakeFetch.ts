import { vi } from "vitest";

export const SAMPLE_TASK = {
  id: "6f1c2a8e-4f5b-4e1a-9d3c-1b2a3c4d5e6f",
  title: "Write tests",
  completed: false,
  createdAt: "2024-05-06T07:08:09.123Z",
  updatedAt: "2024-05-06T07:08:09.123Z",
} as const;

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Replaces global fetch with a mock that answers each call in order. */
export function stubFetch(...responses: Array<Response | Error>) {
  const fetchMock = vi.fn<typeof fetch>();

  for (const response of responses) {
    if (response instanceof Error) {
      fetchMock.mockRejectedValueOnce(response);
    } else {
      fetchMock.mockResolvedValueOnce(response);
    }
  }

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}
