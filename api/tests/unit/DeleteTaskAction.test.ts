import test from "node:test";
import assert from "node:assert/strict";

import { DeleteTaskAction } from "../../src/Domain/Tasks/Actions/DeleteTaskAction.js";
import { TaskNotFoundError } from "../../src/Domain/Tasks/Exceptions/TaskNotFoundError.js";

const TASK_ID = "6f1c2a8e-4f5b-4e1a-9d3c-1b2a3c4d5e6f";

test("deletes an existing task", async () => {
  const deletedIds: string[] = [];
  const action = new DeleteTaskAction({
    delete: async (id) => {
      deletedIds.push(id);
      return true;
    },
  });

  await action.execute(TASK_ID);

  assert.deepEqual(deletedIds, [TASK_ID]);
});

test("throws TaskNotFoundError when nothing was deleted", async () => {
  const action = new DeleteTaskAction({ delete: async () => false });

  await assert.rejects(action.execute(TASK_ID), (error: unknown) => {
    assert.ok(error instanceof TaskNotFoundError);
    assert.equal(error.taskId, TASK_ID);
    return true;
  });
});
