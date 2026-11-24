# Architecture guide

This starter organises both projects by **business concept** rather than by
technical layer. The approach is adapted from *Laravel Beyond CRUD* (Brent
Roose / Spatie) to TypeScript, Express and Next.js. It is a pragmatic,
DDD-inspired structure, not a full DDD implementation.

- [1. What comes from the book, and what is adapted](#1-what-comes-from-the-book-and-what-is-adapted)
- [2. Domain, Application, Support](#2-domain-application-support)
- [3. The API project](#3-the-api-project)
- [4. The frontend project](#4-the-frontend-project)
- [5. One request, end to end](#5-one-request-end-to-end)
- [6. Adding another feature](#6-adding-another-feature)

---

## 1. What comes from the book, and what is adapted

**Principles taken from *Laravel Beyond CRUD*:**

- Group code by business concept (the *domain*), not by framework file type.
- Keep domain code apart from the *applications* that expose it (an HTTP
  API, an admin panel, a console, …).
- Put business operations in **Actions**: small classes with one public
  operation.
- Pass structured input through **Data Transfer Objects** instead of loose
  arrays or request objects.
- Keep **models** small and focused on data.
- Keep controllers thin: they translate HTTP to domain calls and back.
- Add abstractions only when they solve a real problem.

**Adaptations for this stack.** The book does not prescribe these:

| Adaptation | Why |
|---|---|
| `MysqlTaskStore` persistence class | There is no ORM. A small class keeps SQL in one place. |
| awilix container with auto-registration (`Support/Container/`) | Builds Actions and Controllers automatically, so nobody wires them by hand. |
| Dependencies typed as `Pick<MysqlTaskStore, "insert">` | An Action asks only for the store methods it uses, so tests can pass a tiny fake. |
| `Request` files are Zod parsers that return DTOs | They play the role of Laravel's form requests. |
| `Resource` files are plain mapping functions | They play the role of Laravel's API resources. |
| Frontend `Domain/` with a feature API client and Zod models | The frontend also needs typed business data, but it gets that data over HTTP. |
| React hooks in `Application/Web/…/Hooks` | Hooks coordinate UI workflows, so they belong to the application. |
| View-model functions | Display-only transformations, kept out of domain models. |

## 2. Domain, Application, Support

Both projects have the same three top-level folders:

| Folder | Holds | Depends on |
|---|---|---|
| `Domain/<Concept>/` | What the business *is* and *does*: models, DTOs, rules, actions, exceptions (API) or typed data and the API client (frontend) | Support, never Application |
| `Application/<App>/<Module>/` | How one application exposes domains: controllers, routes, request parsing, resources (API) or components, hooks, form schemas, view models (frontend) | Domain and Support |
| `Support/` | Technical helpers with no business meaning: config, database pool, HTTP utilities, UI primitives | nothing above |

"Same architecture" means the same **organising idea**. It does not mean the
same responsibilities:

| | API | Frontend |
|---|---|---|
| Business rules | **Authoritative.** `normalizeTaskTitle` | Mirrors rules only for quick feedback (`taskFormSchema`) |
| Domain operations | Actions (`CreateTaskAction`, …) | None needed yet (see [§4.5](#45-when-a-frontend-action-is-useful)) |
| Persistence | `MysqlTaskStore`, SQL | None. Talks to the API only |
| Data shape | `Task` with `Date` fields | `Task` with ISO string dates, validated at runtime |
| Application layer | Express controllers, routes | Next.js components, hooks |

Application modules do not have to mirror domain groups one to one. A
future `Application/Api/Dashboard/` could use both `Domain/Tasks` and a
`Domain/Projects`.

Next.js requires a lowercase `src/app/` folder for routes. That folder holds only
thin route files. The frontend's *architectural* application layer is
`src/Application/`.

---

## 3. The API project

```
api/src/
├── Domain/Tasks/
│   ├── Actions/              CreateTaskAction, UpdateTaskAction, DeleteTaskAction
│   ├── DataTransferObjects/  CreateTaskData, UpdateTaskData
│   ├── Exceptions/           InvalidTaskTitleError, TaskNotFoundError
│   ├── Models/               Task
│   ├── Persistence/          MysqlTaskStore
│   └── Rules/                normalizeTaskTitle
├── Application/
│   ├── Api/Tasks/
│   │   ├── Controllers/      one controller per endpoint
│   │   ├── Requests/         Zod parsers: unknown input → DTO
│   │   └── Resources/        Task → JSON shape
│   └── Console/RouteList/    `npm run route:list`
├── Support/
│   ├── Config/loadConfig.ts
│   ├── Container/            registerClasses, resolveClass
│   ├── Database/createDatabasePool.ts
│   └── Http/                 RouteTable, errorHandler, notFoundHandler, sendError
├── app.ts                    builds the Express app (no listener)
├── bootstrap.ts              builds the container: bindings + auto-registration
├── routes.ts                 every API endpoint, in one file
└── server.ts                 loads config, creates pool, listens
```

### 3.1 Models stay small

```ts
// api/src/Domain/Tasks/Models/Task.ts
export type Task = Readonly<{
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;
```

No SQL, no HTTP, no workflows. Just the data a task consists of.

### 3.2 Rules are reusable and enforced by the domain

Creating and renaming both call the same rule:

```ts
// api/src/Domain/Tasks/Rules/normalizeTaskTitle.ts
export function normalizeTaskTitle(value: string): string {
  const title = value.trim();

  if (title.length === 0 || title.length > MAX_TASK_TITLE_LENGTH) {
    throw new InvalidTaskTitleError();
  }

  return title;
}
```

The rule runs inside the Actions, so it holds even when an Action is called
directly from a script, a test or a future queue worker, not only over HTTP.

### 3.3 Why Actions live in Domain

An Action is a business operation: "update a task". It does not know whether
the request came from HTTP, a CLI or a test. Dependencies go in the
constructor, and operation input goes into `execute()`:

```ts
// api/src/Domain/Tasks/Actions/UpdateTaskAction.ts
export class UpdateTaskAction {
  constructor(
    private readonly taskStore: Pick<MysqlTaskStore, "findById" | "update">,
  ) {}

  async execute(id: string, data: UpdateTaskData): Promise<Task> {
    // Validate before touching storage so invalid input never causes writes.
    const title = data.title === undefined
      ? undefined
      : normalizeTaskTitle(data.title);

    const existing = await this.taskStore.findById(id);

    if (existing === null) {
      throw new TaskNotFoundError(id);
    }
    // …
    const updated: Task = {
      ...existing,
      title: title ?? existing.title,
      completed: data.completed ?? existing.completed,   // false is kept, not treated as "missing"
      updatedAt: new Date(),
    };
```

You never call `new UpdateTaskAction(…)` in application code: the container
builds it (see [§3.8](#38-the-container-like-laravels-service-container)).
The parameter **name** `taskStore` tells the container what to inject, and
the **type** `Pick<MysqlTaskStore, "findById" | "update">` asks only for the
two methods the Action uses. Tests skip the container and pass a small fake
(`api/tests/unit/UpdateTaskAction.test.ts`):

```ts
const action = new UpdateTaskAction({ findById: store.find, update: store.save });
```

There is deliberately no `TaskService` that collects every operation.

Reads (`list`, `show`) have no Action because they contain no business
decision. Their controllers receive the store directly.

### 3.4 Request validation and DTO mapping belong to the application

The HTTP layer checks the *shape* of untrusted input and turns it into a DTO.
The domain checks the *business* constraint. These are two separate jobs:

```ts
// api/src/Application/Api/Tasks/Requests/UpdateTaskRequest.ts
const updateTaskRequestSchema = z.object({
  title: z.string().optional(),
  completed: z.boolean().optional(),
}).strict().refine(
  (body) => body.title !== undefined || body.completed !== undefined,
  { message: "Provide at least one field to update: title or completed." },
);

export function parseUpdateTaskRequest(input: unknown): UpdateTaskData {
  const parsed = updateTaskRequestSchema.parse(input);

  return { title: parsed.title, completed: parsed.completed };
}
```

`{ "title": 42 }` fails here with **400** (wrong shape).
`{ "title": "   " }` passes here and fails in the domain with **422**
(right shape, breaks a business rule). An empty PATCH body is an HTTP
contract issue, so this file rejects it.

### 3.5 Where SQL belongs

Only in `Domain/Tasks/Persistence/MysqlTaskStore.ts`. It uses
parameterised SQL, maps rows explicitly, and documents its UTC convention:

```ts
// api/src/Domain/Tasks/Persistence/MysqlTaskStore.ts
async update(task: Task): Promise<boolean> {
  const [result] = await this.pool.execute<ResultSetHeader>(
    `UPDATE tasks
     SET title = ?, completed = ?, updated_at = ?
     WHERE id = ?`,
    [task.title, Number(task.completed), task.updatedAt, task.id],
  );

  return result.affectedRows > 0;   // matched rows (FOUND_ROWS), so "unchanged" ≠ "missing"
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    completed: Number(row.completed) === 1,   // TINYINT(1) → boolean
    createdAt: toDate(row.created_at),        // DATETIME(3), read as UTC
    updatedAt: toDate(row.updated_at),
  };
}
```

The connection pool lives in `Support/Database/createDatabasePool.ts`. It
sets `timezone: "Z"` and is lazy: no connection opens before the first
query, so the API can start while MySQL is still initialising.

The store is a small adapter, not a generic repository framework. It lives
under `Domain/Tasks` because it persists *tasks*. When a second feature
appears, it gets its own store next to its own domain.

### 3.6 Thin controllers and resources

```ts
// api/src/Application/Api/Tasks/Controllers/UpdateTaskController.ts
handle = async (req, res, next) => {
  try {
    const id = parseTaskIdParameter(req.params);
    const input = parseUpdateTaskRequest(req.body);
    const task = await this.updateTask.execute(id, input);

    res.json({ data: toTaskResource(task) });
  } catch (error: unknown) {
    next(error);
  }
};
```

```ts
// api/src/Application/Api/Tasks/Resources/TaskResource.ts
export function toTaskResource(task: Task): TaskResource {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
```

### 3.7 Routes: where the URLs are defined

Every endpoint lives in one file, `src/routes.ts`. To see what the API
offers, read that file from top to bottom:

```ts
// api/src/routes.ts
export function registerRoutes(
  app: Express,
  container: AwilixContainer,
): readonly RegisteredRoute[] {
  const api = new RouteTable(container, "/api");

  // Tasks
  api.get("/tasks", ListTasksController);
  api.post("/tasks", CreateTaskController);
  api.get("/tasks/:id", ShowTaskController);
  api.patch("/tasks/:id", UpdateTaskController);
  api.delete("/tasks/:id", DeleteTaskController);

  api.mount(app);

  return api.routes;
}
```

`RouteTable` (`Support/Http/RouteTable.ts`) takes each controller from the
container with its dependencies already built (see [§3.8](#38-the-container))
and registers its `handle` method with Express. It also remembers every
route, because Express cannot reliably report the full paths of routes
inside mounted routers. Routes are the one place where features meet: the
controllers themselves still live in their feature folders.

**Listing routes.** `npm run route:list` prints every route as plain text,
one per line, so it can be searched with `grep` or `findstr`:

```
$ npm run -s route:list
METHOD    PATH            CONTROLLER
GET|HEAD  /api/tasks      ListTasksController
POST      /api/tasks      CreateTaskController
GET|HEAD  /api/tasks/:id  ShowTaskController
PATCH     /api/tasks/:id  UpdateTaskController
DELETE    /api/tasks/:id  DeleteTaskController

Showing 5 routes.
```

The command lives in `Application/Console/RouteList/`, because a console
command is another application using the same domain, alongside
`Application/Api/`. It builds the same container as the HTTP server
(`buildContainer` in `bootstrap.ts`), but it never opens a database
connection and needs no environment variables.

### 3.8 The container

Express has no container of its own, so the API uses
[awilix](https://github.com/jeffijoe/awilix). It is configured in
`bootstrap.ts` and does two things:

```ts
// api/src/bootstrap.ts
const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
});

// Explicit bindings: values and implementations the container cannot
// discover on its own.
container.register({
  pool: asValue(options.pool),
  taskStore: asClass(MysqlTaskStore).singleton(),
});

// Auto-registration: every class in these folders, by class name.
// A new Action or Controller is available as soon as its file exists.
await registerClasses(
  container,
  [
    "Domain/*/Actions/*.{ts,js}",
    "Application/Api/*/Controllers/*.{ts,js}",
  ],
  import.meta.dirname,
);
```

**How injection works.** `InjectionMode.CLASSIC` reads constructor
**parameter names**, not types. The container then builds the whole chain:

```
CreateTaskController(createTaskAction)
  └─ CreateTaskAction(taskStore)
       └─ MysqlTaskStore(pool)
            └─ pool (the mysql2 pool from server.ts)
```

**Naming rule.** `registerClasses` registers each exported class under its
camelCase name: `CreateTaskAction` becomes `createTaskAction`. To receive
one, name the parameter the same:

```ts
constructor(private readonly createTaskAction: CreateTaskAction) {}
```

A typo fails at startup with an awilix "Could not resolve" error that names
the missing dependency. It never fails later, in the middle of a request.

**Why not tsyringe or InversifyJS?** They match dependencies by type, but
only through decorators plus `emitDecoratorMetadata`. `tsx`, the
dev runner, is built on esbuild, which does not emit that metadata, so
autowiring would work after `tsc` but break in `npm run dev`. awilix needs
no decorators.

**Lifetimes.** Everything is a singleton, created once and reused. That is
safe because Actions, Controllers and the store hold no per-request state.

**Tests** usually skip the container and pass fakes straight to the
constructor. `api/tests/unit/container.test.ts` shows the other option:
registering a fake `taskStore` in a container and letting it build the rest.

`createApp` (in `app.ts`) adds CORS for the single configured origin, JSON
parsing, the JSON 404 handler, and the central error handler. `server.ts`
is the only file that calls `listen()`, so tests use `bootstrap()` with
Supertest and never open a port.

The error handler (`Support/Http/errorHandler.ts`) maps `ZodError` → 400,
malformed JSON → 400, `TaskNotFoundError` → 404, `InvalidTaskTitleError` →
422, and anything else → 500 with a generic message. Unexpected errors are
logged with name, message, code and stack. mysql2's `sql` property is not
logged because it can contain parameter values.

---

## 4. The frontend project

```
frontend/src/
├── app/                              Next.js routes only (thin)
│   ├── layout.tsx, page.tsx
│   └── tasks/ page.tsx, loading.tsx, new/page.tsx, [id]/page.tsx, [id]/not-found.tsx
├── Domain/Tasks/
│   ├── Api/TasksApi.ts               feature API client (no React)
│   ├── DataTransferObjects/          CreateTaskData, UpdateTaskData
│   └── Models/Task.ts                Zod schema + inferred type
├── Application/Web/Tasks/
│   ├── Components/                   CreateTaskForm, TaskList, TaskListItem, TaskDetails, …
│   ├── Hooks/                        useCreateTask, useUpdateTask, useDeleteTask
│   ├── Requests/taskFormSchema.ts    form validation for quick feedback
│   ├── ViewModels/toTaskViewModel.ts display labels and formatting
│   ├── browserTasksApi.ts            client instance for the browser
│   └── serverTasksApi.ts             client instance for Server Components (server-only)
└── Support/
    ├── Config/                       publicConfig (browser-safe), serverConfig (server-only)
    ├── Http/                         requestJson, ApiRequestError
    └── UI/                           Notice, describeError
```

### 4.1 Domain: typed data validated at runtime

```ts
// frontend/src/Domain/Tasks/Models/Task.ts
export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Task = z.infer<typeof taskSchema>;
```

Dates are strings because that is what crosses the wire. The API client never
uses `as Task`. Every response goes through a schema:

```ts
// frontend/src/Domain/Tasks/Api/TasksApi.ts
async update(id: string, data: UpdateTaskData): Promise<Task> {
  const response = await requestJson(taskUrl(id), {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  return parse(taskResponseSchema, response, "task").data;
},
```

`createTasksApi(baseUrl)` receives its base URL. It does not check whether it
runs in a browser or on the server. That decision is made once, in
`Application/Web/Tasks/browserTasksApi.ts` and `serverTasksApi.ts`.

### 4.2 Support: generic HTTP and configuration

`requestJson` knows nothing about tasks. It sets headers, turns network
failures and the API's `{ error: { code, message } }` contract into an
`ApiRequestError`, and returns `unknown` for the caller to validate.

```ts
// frontend/src/Support/Config/serverConfig.ts
import "server-only";

export const serverConfig = {
  apiUrl: process.env.API_INTERNAL_URL ?? publicConfig.apiUrl,
} as const;
```

The browser calls `NEXT_PUBLIC_API_URL` (`http://localhost:4000/api`).
Server Components inside Docker call `API_INTERNAL_URL` (`http://api:4000/api`).
`import "server-only"` makes the build fail if a Client Component ever
imports the internal address. The frontend has no database configuration.

### 4.3 Why hooks belong to the application side

A hook manages one UI workflow: validation feedback, pending state, double
submission, error display. Those are application concerns, so hooks live in
`Application/Web/Tasks/Hooks`. They call the domain API client and never
build URLs or SQL themselves:

```ts
// frontend/src/Application/Web/Tasks/Hooks/useCreateTask.ts
const parsed = taskFormSchema.safeParse(input);

if (!parsed.success) {
  setError(parsed.error.issues[0]?.message ?? "Check the task details.");
  return false;
}

inFlight.current = true;
setPending(true);

try {
  const task = await browserTasksApi.create(parsed.data);
  setCreatedTask(task);
  return true;
} catch (cause: unknown) {
  setError(describeError(cause, "Unable to create the task."));
  return false;
} finally { /* reset pending */ }
```

`taskFormSchema` repeats the 1–200 character rule **for quick feedback
only**. If it drifts from the API, the API still rejects bad input with 422,
and the hook shows that message.

### 4.4 Server and Client Components

Pages stay Server Components. Data is loaded on the server, and only
interactive parts are Client Components:

```tsx
// frontend/src/app/tasks/page.tsx         (Server Component)
export const dynamic = "force-dynamic";

export default function TasksPage() {
  return (
    <main className="stack">
      <div className="row spread">
        <h1>Tasks</h1>
        <Link className="button" href="/tasks/new">New task</Link>
      </div>
      <TasksOverview />
    </main>
  );
}
```

`TasksOverview` (server) loads tasks and renders `TaskList` (server), which
renders one `TaskListItem` per task. `TaskListItem` is a Client Component
with the complete/reopen and delete buttons. After a successful mutation it
shows the returned task at once and calls `router.refresh()`, so the server
list is reloaded too.

### 4.5 When a frontend Action is useful

This starter has **no frontend Actions**. Every workflow is "validate, call
one endpoint, show the result", and the hook already does that. An Action
that only forwarded arguments would be redundant:

```ts
// Redundant: adds a layer, adds nothing else
class CreateTaskAction {
  execute(data: CreateTaskData) { return tasksApi.create(data); }
}
```

Add a frontend Action (in `Domain/<Concept>/Actions/`) when a real
client-side workflow appears that is independent of React. For example,
importing a CSV that is parsed, validated row by row and sent in batches
with retry, or an offline queue that stores changes and replays them later.
The hook would then call the Action and only manage UI state.

---

## 5. One request, end to end

Renaming a task is a different workflow from creation, but it follows the same path. Here is
**creating** a task on `/tasks/new`:

**1. Next.js page** (`frontend/src/app/tasks/new/page.tsx`). It is a Server Component that
only places the form:

```tsx
export default function NewTaskPage() {
  return (
    <main className="stack">
      <h1>Create a task</h1>
      <CreateTaskForm />
      …
```

**2. Feature component** (`Application/Web/Tasks/Components/CreateTaskForm.tsx`, client).
It owns the input value and passes it to the hook:

```tsx
const succeeded = await submit({ title });
if (succeeded) {
  setTitle("");
}
```

**3. Application hook** (`Hooks/useCreateTask.ts`). It validates with `taskFormSchema`
(trims, checks 1–200 characters), prevents double submission, and calls the client:
`browserTasksApi.create(parsed.data)`.

**4. Feature API client** (`Domain/Tasks/Api/TasksApi.ts` → `Support/Http/requestJson.ts`).
It sends `POST http://localhost:4000/api/tasks` with `{"title":"Buy milk"}`.

**5. Express route** (`api/src/routes.ts`). CORS lets the request through
because the origin is `http://localhost:3000`. `express.json()` parses the
body, and this route matches:

```ts
api.post("/tasks", CreateTaskController);
```

**6. Controller and request parsing** (`Controllers/CreateTaskController.ts`,
`Requests/CreateTaskRequest.ts`). `parseCreateTaskRequest(req.body)` checks
the shape and returns a `CreateTaskData` DTO.

**7. Domain Action** (`Domain/Tasks/Actions/CreateTaskAction.ts`). It runs
`normalizeTaskTitle`, builds a `Task` with a new UUID, `completed: false`
and equal timestamps, and calls `this.taskStore.insert(task)`. The container
injected `taskStore` when it built the Action.

**8. MySQL persistence** (`Domain/Tasks/Persistence/MysqlTaskStore.ts`). `insert()` runs a
parameterised `INSERT`, with `completed` as `0` and dates written as UTC `DATETIME(3)`.

**9. Response resource** (`Resources/TaskResource.ts`). The controller responds
`201 { "data": toTaskResource(task) }` with ISO date strings. If anything
throws, `Support/Http/errorHandler.ts` sends the error contract instead.

**10. Frontend response validation** (`TasksApi.create`). The JSON is checked
against `taskResponseSchema`. A mismatch becomes an error and is never cast
blindly. An error body becomes an `ApiRequestError` with the API's message.

**11. Updated UI.** The hook stores `createdTask`, `toTaskViewModel` adds
`statusLabel` ("Open") and the link `href`, and the form shows "Created: Buy
milk (Open). View task". The list page always renders on request, so it shows
the new task on the next visit. On the list and detail pages, mutations call
`router.refresh()` as well.

---

## 6. Adding another feature

Suppose you add **Projects**. Keep everything about projects together:

```
api/src/Domain/Projects/
  Models/Project.ts
  DataTransferObjects/CreateProjectData.ts
  Rules/normalizeProjectName.ts         (only if there is a real rule)
  Exceptions/ProjectNotFoundError.ts
  Actions/CreateProjectAction.ts
  Persistence/MysqlProjectStore.ts
api/src/Application/Api/Projects/
  Controllers/  Requests/  Resources/

frontend/src/Domain/Projects/
  Models/Project.ts  DataTransferObjects/  Api/ProjectsApi.ts
frontend/src/Application/Web/Projects/
  Components/  Hooks/  Requests/  ViewModels/
frontend/src/app/projects/page.tsx      (thin route)
```

Then:

1. Add the table to `docker/mysql/init.sql` for **fresh** databases, and run
   the same SQL by hand on existing ones. `init.sql` is not a migration tool.
2. Bind the store in `api/src/bootstrap.ts`:
   `projectStore: asClass(MysqlProjectStore).singleton()`. Actions and
   Controllers need no registration. The container picks them up from their
   folders, as long as constructor parameter names match the camelCase class
   names (`createProjectAction`, `projectStore`).
3. Add the endpoints to `api/src/routes.ts` under a `// Projects` comment,
   e.g. `api.get("/projects", ListProjectsController)`.
4. Map new domain exceptions in `Support/Http/errorHandler.ts`.
5. Write Action tests that pass a small fake store, and add integration
   tests for the real store.

Guidelines:

- Only create folders that have real files. There is no need for `Events/`,
  `States/` or `ValueObjects/` until a feature needs them.
- If tasks start belonging to projects, `Domain/Tasks` may import a
  `Project` type. An application module such as a dashboard can use both
  domains.
- Do not move shared code to `Support/` just because two features use it.
  `Support/` is for technical code with no business meaning.
