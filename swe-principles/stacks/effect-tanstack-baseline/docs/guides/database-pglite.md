# PGlite with Drizzle Guide

Compact guide for using PGlite as a local embedded Postgres with:

- `drizzle-orm/pglite` for queries
- `@electric-sql/pglite` for storage
- `effect` for dependency injection and lifecycle

## Overview

Use PGlite when you want PostgreSQL-shaped local persistence without running a
separate database server.

Recommended pattern:

- Drizzle `pg-core` defines the schema
- PGlite powers local development and node-mode persistence tests
- PostgreSQL powers shared and deployed environments
- Effect provides the database service boundary

This keeps one SQL model instead of splitting local development onto SQLite.

---

## Installation

### 1. Install Dependencies

```bash
bun add drizzle-orm @electric-sql/pglite effect
```

**Package Purposes:**

- `drizzle-orm` - schema and type-safe queries
- `@electric-sql/pglite` - embedded Postgres runtime
- `effect` - dependency injection, scoping, cleanup

---

## Project Structure

Keep the layout small and explicit:

```text
src/
├── db/
│   ├── schema.ts            # Drizzle pg-core schema
│   ├── client.ts            # PGlite + Drizzle setup
│   ├── layer.ts             # Effect layer for DI
│   └── test-support.ts      # Seed helpers for tests
```

---

## Configuration

Use a local data directory for persisted development state:

```bash
PGLITE_DATA_DIR="./data/pglite"
```

For ephemeral tests, prefer per-test in-memory or isolated directories rather
than sharing one persistent database.

---

## Schema Definition

Define the schema with `drizzle-orm/pg-core`, not SQLite schema types:

```ts
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const todosTable = pgTable("todos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull(),
})
```

This is the key design choice. The same schema can be used locally with PGlite
and remotely with PostgreSQL.

---

## Database Client Setup

Create `src/db/client.ts`:

```ts
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"

const dataDir = process.env.PGLITE_DATA_DIR || "./data/pglite"

export const makeDb = async () => {
  const client = new PGlite(dataDir)
  const db = drizzle({ client })

  return { db, client }
}
```

---

## Effect Integration

Create `src/db/layer.ts`:

```ts
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { makeDb } from "./client"

export class Db
  extends Context.Tag("Db")<Db, Awaited<ReturnType<typeof makeDb>>>()
{}

export const DbLive = Layer.scoped(
  Db,
  Effect.acquireRelease(
    Effect.promise(makeDb),
    ({ client }) => Effect.promise(() => client.close()),
  ),
)
```

Inject this service into repositories and application services instead of
constructing clients ad hoc.

---

## Migrations

Keep migrations derived from the Drizzle schema.

Example `drizzle.config.ts`:

```ts
import type { Config } from "drizzle-kit"

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
} satisfies Config
```

PGlite should share the same Postgres-oriented schema model. Do not introduce a
second local schema just because the database is embedded.

---

## Testing With Seeded Instances

PGlite is a strong fit for repository and service invariant tests:

- create one isolated database per test or suite
- seed explicit named states
- run these tests in node mode
- prove behavior against persisted state instead of mocks

Minimal shape:

```ts
const client = new PGlite()
const db = drizzle({ client })
```

Then apply schema setup and seed data before running the invariant under test.

---

## Relationship To PostgreSQL

Use this split:

- PGlite for local development
- PGlite for deterministic persistence tests
- PostgreSQL for shared, staging, and production environments

The important consistency point is the schema and service boundary, not forcing
both environments through the exact same low-level driver.

---

## Practical Rules

- keep SQL structure in Drizzle `pg-core`
- inject the database through an Effect service
- use PGlite for local and test, PostgreSQL for shared environments
- avoid a separate SQLite path
- prefer seeded persistence tests over mocked repositories

## Vendored Source

Drizzle ORM source is vendored at `.repos/drizzle/` for reference when
implementing database patterns. This provides:

- Direct source code inspection for debugging and understanding
- Guaranteed access to the exact version (v1.0.0-rc.2) used in this project
- Offline reference without external network dependencies

To update the vendored copy:

```bash
git subtree pull --prefix=.repos/drizzle https://github.com/drizzle-team/drizzle-orm.git v1.0.0-rc.2 --squash
```

## Related

- [PostgreSQL Guide](./database-postgresql.md)
- [Testing Guide](./testing.md)
