import { describe, expect, test } from "vitest";

import { formatUtcTimestamp, toTaskViewModel } from "@/Application/Web/Tasks/ViewModels/toTaskViewModel";
import { SAMPLE_TASK } from "./fakeFetch";

describe("toTaskViewModel", () => {
  test("labels an open task", () => {
    const view = toTaskViewModel(SAMPLE_TASK);

    expect(view.statusLabel).toBe("Open");
    expect(view.toggleLabel).toBe("Mark as completed");
    expect(view.href).toBe(`/tasks/${SAMPLE_TASK.id}`);
    expect(view.wasEdited).toBe(false);
  });

  test("labels a completed, edited task", () => {
    const view = toTaskViewModel({
      ...SAMPLE_TASK,
      completed: true,
      updatedAt: "2024-05-07T10:00:00.000Z",
    });

    expect(view.statusLabel).toBe("Completed");
    expect(view.toggleLabel).toBe("Reopen");
    expect(view.wasEdited).toBe(true);
    expect(view.updatedLabel).toBe("2024-05-07 10:00 UTC");
  });

  test("formats timestamps in UTC regardless of locale", () => {
    expect(formatUtcTimestamp("2024-05-06T23:59:59.999+02:00")).toBe("2024-05-06 21:59 UTC");
    expect(formatUtcTimestamp("not a date")).toBe("Unknown date");
  });
});
