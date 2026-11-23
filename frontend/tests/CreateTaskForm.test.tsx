import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { CreateTaskForm } from "@/Application/Web/Tasks/Components/CreateTaskForm";
import { jsonResponse, SAMPLE_TASK, stubFetch } from "./fakeFetch";

async function submitTitle(title: string) {
  const user = userEvent.setup();
  render(<CreateTaskForm />);

  const input = screen.getByLabelText("Task title");

  if (title.length > 0) {
    await user.type(input, title);
  }

  await user.click(screen.getByRole("button", { name: "Create task" }));

  return input as HTMLInputElement;
}

describe("CreateTaskForm", () => {
  test("creates a task, clears the input and shows the result", async () => {
    const fetchMock = stubFetch(jsonResponse(201, { data: SAMPLE_TASK }));

    const input = await submitTitle("  Write tests  ");

    const status = await screen.findByRole("status");
    expect(status.textContent).toContain("Created: Write tests (Open)");
    expect(screen.getByRole("link", { name: "View task" }).getAttribute("href"))
      .toBe(`/tasks/${SAMPLE_TASK.id}`);
    expect(input.value).toBe("");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ title: "Write tests" }));
  });

  test("shows the API's message and keeps the input when creation fails", async () => {
    stubFetch(jsonResponse(422, {
      error: {
        code: "INVALID_TASK_TITLE",
        message: "Task titles must contain between 1 and 200 characters.",
      },
    }));

    const input = await submitTitle("Rejected by the API");

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Task titles must contain between 1 and 200 characters.");
    expect(input.value).toBe("Rejected by the API");
    expect(screen.queryByRole("status")).toBeNull();
  });

  test("validates a blank title without calling the API", async () => {
    const fetchMock = stubFetch();

    await submitTitle("   ");

    expect((await screen.findByRole("alert")).textContent).toBe("Enter a task title.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("shows a network failure", async () => {
    stubFetch(new TypeError("Failed to fetch"));

    await submitTitle("Offline task");

    expect((await screen.findByRole("alert")).textContent).toBe("Unable to reach the API.");
  });
});
