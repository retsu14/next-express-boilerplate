# Tasks starter: Next.js + Express + MySQL

A small, runnable full-stack starter with one complete feature (Tasks):

- **frontend/**: Next.js (App Router), React, TypeScript, Zod
- **api/**: Express 5, TypeScript, Zod, mysql2 (parameterised SQL, no ORM)
- **docker/mysql/init.sql**: creates the `tasks` table
- **docker-compose.yaml**: local development services: `frontend`, `api`, `mysql`, `phpmyadmin`

Both projects use the same domain-oriented layout (`Domain/`, `Application/`, `Support/`).
[docs/architecture.md](docs/architecture.md) explains the layout and walks through a full request.

```
.
├── api/                  Express API (business rules, persistence, HTTP)
├── frontend/             Next.js app (typed API client, UI workflows)
├── docker/mysql/init.sql Table setup for a fresh MySQL data directory
├── docs/architecture.md  Architecture guide with code from this project
├── docker-compose.yaml   Local development stack
└── .env.example          Optional Compose overrides (local dev passwords)
```

Versions: Node.js 24, Next.js 16.4, React 19.3, Express 5.3, Zod 4, mysql2 3,
TypeScript 6.0 (strict), MySQL 8.4.

## Requirements

- Docker Desktop (or Docker Engine) with Docker Compose v2
- Optional, to run tools outside Docker: Node.js 24 and npm

## Initial setup

The Compose file has defaults for every value, so copying `.env` is optional.
Copy it if you want to change the local development passwords.

```bash
cp .env.example .env              # PowerShell: Copy-Item .env.example .env
docker compose build
```

> The passwords in `.env.example` are **local development credentials only**.
> MySQL applies them only when its data volume is first created.

## Start the stack

```bash
docker compose up -d
docker compose logs -f            # Ctrl+C stops following logs, not the containers
```

| What      | URL                              |
|-----------|----------------------------------|
| Frontend  | http://localhost:3000            |
| Tasks UI  | http://localhost:3000/tasks      |
| API       | http://localhost:4000/api/tasks  |
| phpMyAdmin| http://localhost:8080            |

Ports are published on `127.0.0.1` only. MySQL is **not** published. It is
reachable only from the other containers, at `mysql:3306`.

**phpMyAdmin** connects to the `mysql` service. Log in with user `app` and the
`MYSQL_PASSWORD` value (default `secret`) to manage the `app` database. Use
`root` and `MYSQL_ROOT_PASSWORD` for full access. It is a local development
tool only. Never expose it publicly.

**First start:** MySQL initialises its data directory the first time, which
takes some seconds. `depends_on` only sets start order and does **not** wait
for MySQL to be ready. Until it is, API requests that touch the database
return `500 INTERNAL_ERROR` and the frontend shows "Could not load tasks".
Reload once MySQL logs `ready for connections` (`docker compose logs mysql`).

Source code is bind-mounted. Edits under `api/src` restart the API (`tsx watch`),
and edits under `frontend/src` hot-reload the Next.js dev server. Both use file
polling because Docker Desktop bind mounts do not deliver change events.

### Try the API

```bash
curl -X POST http://localhost:4000/api/tasks -H "Content-Type: application/json" -d "{\"title\":\"Try the API\"}"
curl http://localhost:4000/api/tasks
curl -X PATCH http://localhost:4000/api/tasks/<id> -H "Content-Type: application/json" -d "{\"completed\":true}"
curl -X DELETE -i http://localhost:4000/api/tasks/<id>
```

| Method | Path             | Success                 | Errors              |
|--------|------------------|-------------------------|---------------------|
| POST   | /api/tasks       | 201 `{ "data": task }`  | 400, 422            |
| GET    | /api/tasks       | 200 `{ "data": [task] }`|                     |
| GET    | /api/tasks/:id   | 200 `{ "data": task }`  | 400, 404            |
| PATCH  | /api/tasks/:id   | 200 `{ "data": task }`  | 400, 404, 422       |
| DELETE | /api/tasks/:id   | 204 (empty body)        | 400, 404            |

Errors always look like `{ "error": { "code": "TASK_NOT_FOUND", "message": "..." } }`.
Codes: `VALIDATION_FAILED` (400), `MALFORMED_JSON` (400), `TASK_NOT_FOUND` (404),
`ROUTE_NOT_FOUND` (404), `PAYLOAD_TOO_LARGE` (413), `INVALID_TASK_TITLE` (422),
`INTERNAL_ERROR` (500).

## Tests and type checking

Run these inside the containers while the stack is up:

```bash
# API: unit + HTTP tests (no database needed)
docker compose exec api npm test

# API: integration tests against the separate `app_test` database
docker compose exec api npm run test:integration

# API: type check
docker compose exec api npm run typecheck

# Frontend: tests (Vitest + Testing Library)
docker compose exec frontend npm test

# Frontend: type check and lint
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run lint
```

The integration tests use `TEST_DB_NAME=app_test`. They refuse to run
unless the name ends in `_test` and is different from `DB_NAME`, and they
delete rows only in that test database.

## Listing API routes

`route:list` prints every API endpoint with its HTTP method and controller.
It needs no database. `-s` hides npm's own header lines.

```bash
docker compose exec api npm run -s route:list
```

```
METHOD    PATH            CONTROLLER
GET|HEAD  /api/tasks      ListTasksController
POST      /api/tasks      CreateTaskController
GET|HEAD  /api/tasks/:id  ShowTaskController
PATCH     /api/tasks/:id  UpdateTaskController
DELETE    /api/tasks/:id  DeleteTaskController

Showing 5 routes.
```

Each route is one plain-text line, so you can search the output:

```bash
docker compose exec api npm run -s route:list | grep tasks       # Linux, macOS, Git Bash
docker compose exec api npm run -s route:list | findstr tasks    # Windows cmd / PowerShell
```

Built-in filters, and JSON for scripts:

```bash
docker compose exec api npm run -s route:list -- --method=GET    # GET also matches HEAD
docker compose exec api npm run -s route:list -- --path=:id      # path contains ":id"
docker compose exec api npm run -s route:list -- --json
```

Inside `api/` on your machine, the same commands work without the
`docker compose exec api` prefix.

## Building both projects

```bash
docker compose exec api npm run build          # compiles to api/dist
docker compose exec frontend npm run build     # production Next.js build in frontend/.next
```

The images in this repository are for development. The builds above check
that both projects compile. They are not a production deployment setup.

> Building the frontend writes to `frontend/.next`, which the running dev
> server also uses. Restart the frontend afterwards: `docker compose restart frontend`.

## Running without Docker (optional)

You need a MySQL 8 server on your machine with the schema from
`docker/mysql/init.sql` loaded.

```bash
cd api
cp .env.example .env          # adjust DB_* values
npm ci
npm run dev                   # http://localhost:4000

cd ../frontend
cp .env.example .env.local
npm ci
npm run dev                   # http://localhost:3000
```

## Dependency maintenance

`node_modules` lives in named volumes (`api-node-modules`,
`frontend-node-modules`) so the container uses Linux builds of the packages.
The host's `node_modules` is never used by the containers.

**Add or update a package** (this updates `package.json` and `package-lock.json`
on your machine through the bind mount, and `node_modules` in the volume):

```bash
docker compose exec api npm install <package>@<version>
docker compose exec frontend npm install -D <package>@<version>
```

**After pulling changes that touched a lockfile**, sync the existing volume:

```bash
docker compose exec api npm ci
docker compose exec frontend npm ci
docker compose restart api frontend
```

**Rebuild the images** when a Dockerfile changes, or to bake the current
lockfile into the image:

```bash
docker compose build
docker compose up -d
```

A named `node_modules` volume keeps its contents across rebuilds, so run
`npm ci` inside the container (above) after a rebuild whose dependencies changed.
If a dependency volume itself is broken, you can remove **only that volume**.
It contains no project data:

```bash
docker compose rm -sf frontend
docker volume rm tasks-starter_frontend-node-modules
docker compose up -d --build frontend
```

You never need to delete the MySQL volume to update dependencies.

## Stop the stack (keeps your data)

```bash
docker compose stop        # stop containers, keep them
docker compose down        # remove containers and network; volumes, including the database, are kept
```

## Reset development data

> ⚠️ **This permanently deletes every task in the development and test
> databases.** There is no undo.

```bash
docker compose down
docker volume rm tasks-starter_mysql-data
docker compose up -d
```

On the next start MySQL creates a fresh data directory and runs
`docker/mysql/init.sql` again.

`docker compose down -v` also does this, but it deletes **all** of the project's
volumes, including both `node_modules` volumes.

### About `init.sql`

Scripts in `/docker-entrypoint-initdb.d` run **only when MySQL starts with an
empty data directory**. They are not a migration mechanism. Editing
`init.sql` does nothing to an existing database. To change the schema of an
existing database, run the SQL yourself, for example:

```bash
docker compose exec mysql mysql -uapp -papp_dev_password app
```

This starter intentionally has no migration framework. Add one when the schema
starts changing regularly.

## Configuration

| Variable              | Where     | Purpose |
|-----------------------|-----------|---------|
| `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD` | root `.env` | Local dev passwords used by Compose |
| `HOST`, `PORT`        | api       | Listener (`0.0.0.0:4000` in Docker) |
| `FRONTEND_ORIGIN`     | api       | The only origin allowed by CORS |
| `DB_HOST` … `DB_NAME` | api       | MySQL connection |
| `TEST_DB_NAME`        | api       | Database for integration tests |
| `NEXT_PUBLIC_API_URL` | frontend  | API address used **by the browser** (`http://localhost:4000/api`) |
| `API_INTERNAL_URL`    | frontend  | API address used **by Server Components** (`http://api:4000/api` in Docker) |

`NEXT_PUBLIC_*` values are embedded in browser JavaScript. Never put
credentials in them. The frontend never sees database settings.
