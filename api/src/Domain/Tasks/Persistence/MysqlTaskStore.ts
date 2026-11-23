import type {
  Pool,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

import type { Task } from "../Models/Task.js";

interface TaskRow extends RowDataPacket {
  id: string;
  title: string;
  completed: number;
  created_at: Date;
  updated_at: Date;
}

const TASK_COLUMNS = "id, title, completed, created_at, updated_at";

/**
 * Small persistence adapter for tasks.
 *
 * Dates are stored in DATETIME(3) columns as UTC. The pool is created with
 * `timezone: "Z"` (see Support/Database/createDatabasePool.ts), so mysql2
 * writes and reads every DATETIME value as UTC.
 */
export class MysqlTaskStore {
  constructor(private readonly pool: Pool) {}

  async insert(task: Task): Promise<void> {
    await this.pool.execute(
      `INSERT INTO tasks
        (id, title, completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        Number(task.completed),
        task.createdAt,
        task.updatedAt,
      ],
    );
  }

  async findAll(): Promise<Task[]> {
    const [rows] = await this.pool.execute<TaskRow[]>(
      `SELECT ${TASK_COLUMNS}
       FROM tasks
       ORDER BY created_at DESC, id ASC`,
    );

    return rows.map(toTask);
  }

  async findById(id: string): Promise<Task | null> {
    const [rows] = await this.pool.execute<TaskRow[]>(
      `SELECT ${TASK_COLUMNS}
       FROM tasks
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    const row = rows[0];

    return row === undefined ? null : toTask(row);
  }

  /**
   * Returns true when a row with the task's id exists, even if none of its
   * values changed. mysql2 enables the FOUND_ROWS client flag by default, so
   * `affectedRows` counts matched rows rather than changed rows.
   */
  async update(task: Task): Promise<boolean> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `UPDATE tasks
       SET title = ?, completed = ?, updated_at = ?
       WHERE id = ?`,
      [
        task.title,
        Number(task.completed),
        task.updatedAt,
        task.id,
      ],
    );

    return result.affectedRows > 0;
  }

  async delete(id: string): Promise<boolean> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      "DELETE FROM tasks WHERE id = ?",
      [id],
    );

    return result.affectedRows > 0;
  }
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    completed: Number(row.completed) === 1,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function toDate(value: unknown): Date {
  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new Error("Stored task contains an invalid date.");
  }

  return date;
}
