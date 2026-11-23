import { describe, expect, test } from "vitest";

import { createTasksApi } from "@/Domain/Tasks/Api/TasksApi";
import { ApiRequestError } from "@/Support/Http/ApiRequestError";
import { jsonResponse, SAMPLE_TASK, stubFetch } from "./fakeFetch";

const api = createTasksApi("http://api.test/api/");

describe("TasksApi response parsing", () => {
  test("create posts JSON and returns the validated task", async () => {
    const fetchMock = stubFetch(jsonResponse(201, { data: SAMPLE_TASK }));

    const task = await api.create({ title: "Write tests" });

    expect(task).toEqual(SAMPLE_TASK);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("http://api.test/api/tasks");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ title: "Write tests" }));
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
  });

  test("list returns every task in the collection", async () => {
    stubFetch(jsonResponse(200, { data: [SAMPLE_TASK, { ...SAMPLE_TASK, completed: true }] }));

    const tasks = await api.list();

    expect(tasks.map((task) => task.completed)).toEqual([false, true]);
  });

  test("rejects a response that does not match the task contract", async () => {
    stubFetch(jsonResponse(200, { data: { ...SAMPLE_TASK, completed: "yes" } }));

    await expect(api.find(SAMPLE_TASK.id)).rejects.toThrow(
      "The API returned an unexpected task response.",
    );
  });

  test("turns the API error contract into an ApiRequestError", async () => {
    stubFetch(jsonResponse(404, {
      error: { code: "TASK_NOT_FOUND", message: "The requested task does not exist." },
    }));

    const error = await api.find(SAMPLE_TASK.id).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({
      status: 404,
      code: "TASK_NOT_FOUND",
      message: "The requested task does not exist.",
      isNotFound: true,
    });
  });

  test("falls back to a status message when the error body is not the contract", async () => {
    stubFetch(new Response("<html>Bad gateway</html>", { status: 502 }));

    await expect(api.list()).rejects.toThrow("The request failed with status 502.");
  });

  test("reports network failures without leaking details", async () => {
    stubFetch(new TypeError("fetch failed: ECONNREFUSED 10.0.0.1"));

    await expect(api.list()).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
      message: "Unable to reach the API.",
    });
  });

  test("update sends only the given fields, including completed: false", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { data: SAMPLE_TASK }));

    await api.update(SAMPLE_TASK.id, { completed: false });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`http://api.test/api/tasks/${SAMPLE_TASK.id}`);
    expect(init?.method).toBe("PATCH");
    expect(init?.body).toBe("{\"completed\":false}");
  });

  test("delete accepts an empty 204 response", async () => {
    stubFetch(new Response(null, { status: 204 }));

    await expect(api.delete(SAMPLE_TASK.id)).resolves.toBeUndefined();
  });
});
