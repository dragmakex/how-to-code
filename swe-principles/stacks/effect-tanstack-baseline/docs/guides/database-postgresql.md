# PostgreSQL with Drizzle Guide

Complete guide to adding PostgreSQL with Drizzle ORM to your Effect TanStack Start application.

## Overview

```mermaid
graph TB
    App[Application] --> Drizzle[Drizzle ORM]
    Drizzle --> Pool[Connection Pool]
    Pool --> PG[(PostgreSQL)]

    subgraph "Development"
        Docker[Docker Compose] --> PG
    end

    subgraph "Effect Integration"
        Effect[Effect Service] --> Drizzle
    end

    style PG fill:#336791
    style Drizzle fill:#C5F74F
```

This guide covers:

- Installing PostgreSQL and Drizzle dependencies
- Setting up database schema
- Configuring connection pooling
- Integrating with Effect-TS
- Adding PostgreSQL to Docker Compose
- Running migrations
- Best practices

---

## Installation

### 1. Install Dependencies

```bash
# Core PostgreSQL and Drizzle packages
bun add drizzle-orm postgres
bun add -d drizzle-kit

# Optional: Effect SQL integration
bun add @effect/sql @effect/sql-drizzle @effect/sql-pg
```

**Package Purposes:**

- `drizzle-orm` - TypeScript ORM with type-safe queries
- `postgres` - PostgreSQL client for Node.js/Bun
- `drizzle-kit` - CLI for migrations and schema management
- `@effect/sql` - Effect-based SQL client (optional)
- `@effect/sql-drizzle` - Drizzle integration for Effect
- `@effect/sql-pg` - PostgreSQL driver for Effect SQL

---

## Project Structure

Create the following structure for database code:

```
src/
├── db/
│   ├── schema/
│   │   ├── users.ts          # User table schema
│   │   ├── posts.ts          # Post table schema
│   │   └── index.ts          # Export all schemas
│   ├── migrations/           # Generated migration files
│   ├── client.ts             # Database client setup
│   ├── layer.ts              # Effect layer for DI
│   └── seed.ts               # Seed data script
├── drizzle.config.ts         # Drizzle Kit configuration
└── .env                      # Environment variables
```

---

## Configuration

### 1. Environment Variables

Add to `.env`:

```bash
# PostgreSQL Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"

# Alternative: Individual parts
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="postgres"
POSTGRES_DB="myapp"

# Connection Pool
POSTGRES_MAX_CONNECTIONS="20"
POSTGRES_IDLE_TIMEOUT="30000"
POSTGRES_CONNECTION_TIMEOUT="2000"
```

Add to `.env` (app container or local env):

```bash
# Docker PostgreSQL Connection
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/myapp"
POSTGRES_HOST="postgres"
POSTGRES_PORT="5432"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="postgres"
POSTGRES_DB="myapp"
```

### 2. Drizzle Configuration

Create `drizzle.config.ts` in project root:

```typescript
import type { Config } from "drizzle-kit"

export default {
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config
```

---

## Schema Definition

### 1. Define Tables

Create `src/db/schema/users.ts`:

```typescript
import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

Create `src/db/schema/posts.ts`:

```typescript
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"
import { users } from "./users"

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  published: timestamp("published"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
```

Create `src/db/schema/index.ts`:

```typescript
export * from "./posts"
export * from "./users"
```

### 2. Schema Types

Drizzle automatically infers TypeScript types:

```typescript
import type { NewUser, User } from "./schema/users"

// User type for selecting data
const user: User = {
  id: 1,
  email: "user@example.com",
  name: "John Doe",
  passwordHash: "...",
  createdAt: new Date(),
  updatedAt: new Date(),
}

// NewUser type for inserting data
const newUser: NewUser = {
  email: "user@example.com",
  name: "John Doe",
  passwordHash: "...",
  // createdAt and updatedAt are optional (have defaults)
}
```

---

## Database Client Setup

### Option A: Standard Drizzle Client

Create `src/db/client.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Create PostgreSQL connection
const connectionString = process.env.DATABASE_URL!

// Connection pool configuration
const client = postgres(connectionString, {
  max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || "20"),
  idle_timeout: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || "30"),
  connect_timeout: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || "2"),
})

// Create Drizzle instance
export const db = drizzle(client, { schema })

// Export types
export type Database = typeof db
```

### Option B: Effect-Based Client (Recommended)

Create `src/db/client.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js"
import { Effect, Layer, ServiceMap } from "effect"
import postgres from "postgres"
import * as schema from "./schema"

// Database service tag
export class DatabaseService extends ServiceMap.Service<DatabaseService, {
  readonly db: ReturnType<typeof drizzle>
  readonly client: ReturnType<typeof postgres>
}>()("DatabaseService") {}

// Create database layer
export const DatabaseLive = Layer.effect(
  DatabaseService,
  Effect.gen(function*() {
    const connectionString = yield* Effect.promise(() =>
      Promise.resolve(process.env.DATABASE_URL)
    )

    if (!connectionString) {
      return yield* Effect.fail(new Error("DATABASE_URL is not set"))
    }

    // Create PostgreSQL client
    const client = postgres(connectionString, {
      max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || "20"),
      idle_timeout: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || "30"),
      connect_timeout: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || "2"),
    })

    // Create Drizzle instance
    const db = drizzle(client, { schema })

    // Cleanup on scope close
    yield* Effect.addFinalizer(() => Effect.promise(() => client.end()))

    return { db, client }
  }),
)

// Helper to get database instance
export const getDatabase = Effect.gen(function*() {
  const { db } = yield* DatabaseService
  return db
})
```

Create `src/db/layer.ts`:

```typescript
import { Layer } from "effect"
import { DatabaseLive } from "./client"

// Combine all database layers
export const DatabaseLayer = DatabaseLive

// Export for use in application
export {
  DatabaseService,
} from "./client"
```

---

## Migrations

### 1. Generate Migration

```bash
# Generate migration from schema changes
bunx drizzle-kit generate

# This creates a new SQL file in src/db/migrations/
# Example: src/db/migrations/0000_initial.sql
```

### 2. Apply Migrations

Create `src/db/migrate.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL!

  // Create connection for migrations
  const connection = postgres(connectionString, { max: 1 })
  const db = drizzle(connection)

  console.log("Running migrations...")

  await migrate(db, {
    migrationsFolder: "./src/db/migrations",
  })

  console.log("Migrations completed!")

  await connection.end()
}

runMigrations().catch((error) => {
  console.error("Migration failed:", error)
  process.exit(1)
})
```

Add script to `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "bun run src/db/migrate.ts",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push",
    "db:seed": "bun run src/db/seed.ts"
  }
}
```

### 3. Run Migrations

```bash
# Generate migration files
bun run db:generate

# Apply migrations to database
bun run db:migrate

# Open Drizzle Studio (GUI)
bun run db:studio
```

---

## Usage Examples

### Basic CRUD Operations

```typescript
import { and, eq, like } from "drizzle-orm"
import { db } from "./db/client"
import { posts, users } from "./db/schema"

// CREATE
const newUser = await db
  .insert(users)
  .values({
    email: "john@example.com",
    name: "John Doe",
    passwordHash: "...",
  })
  .returning()

// READ - Single record
const user = await db.query.users.findFirst({
  where: eq(users.id, 1),
})

// READ - Multiple records
const allUsers = await db.query.users.findMany()

// READ - With relations
const userWithPosts = await db.query.users.findFirst({
  where: eq(users.id, 1),
  with: {
    posts: true,
  },
})

// UPDATE
await db
  .update(users)
  .set({ name: "Jane Doe" })
  .where(eq(users.id, 1))

// DELETE
await db.delete(users).where(eq(users.id, 1))

// Complex query
const searchResults = await db.query.users.findMany({
  where: and(
    like(users.email, "%@example.com"),
    eq(users.name, "John Doe"),
  ),
  limit: 10,
  offset: 0,
})
```

### Effect-Based Operations

Create `src/db/repositories/users.ts`:

```typescript
import { eq } from "drizzle-orm"
import { Effect } from "effect"
import { DatabaseService } from "../layer"
import { type NewUser, type User, users } from "../schema/users"

export const UserRepository = {
  create: (data: NewUser) =>
    Effect.gen(function*() {
      const { db } = yield* DatabaseService
      const [user] = yield* Effect.tryPromise(() =>
        db.insert(users).values(data).returning()
      )
      return user
    }),

  findById: (id: number) =>
    Effect.gen(function*() {
      const { db } = yield* DatabaseService
      const user = yield* Effect.tryPromise(() =>
        db.query.users.findFirst({
          where: eq(users.id, id),
        })
      )
      if (!user) {
        return yield* Effect.fail(new Error("User not found"))
      }
      return user
    }),

  findByEmail: (email: string) =>
    Effect.gen(function*() {
      const { db } = yield* DatabaseService
      return yield* Effect.tryPromise(() =>
        db.query.users.findFirst({
          where: eq(users.email, email),
        })
      )
    }),

  update: (id: number, data: Partial<NewUser>) =>
    Effect.gen(function*() {
      const { db } = yield* DatabaseService
      const [updated] = yield* Effect.tryPromise(() =>
        db
          .update(users)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(users.id, id))
          .returning()
      )
      return updated
    }),

  delete: (id: number) =>
    Effect.gen(function*() {
      const { db } = yield* DatabaseService
      yield* Effect.tryPromise(() => db.delete(users).where(eq(users.id, id)))
    }),

  list: (limit = 10, offset = 0) =>
    Effect.gen(function*() {
      const { db } = yield* DatabaseService
      return yield* Effect.tryPromise(() =>
        db.query.users.findMany({ limit, offset })
      )
    }),
}
```

Usage in application:

```typescript
import { Effect } from "effect"
import { DatabaseLayer } from "./db/layer"
import { UserRepository } from "./db/repositories/users"

const program = Effect.gen(function*() {
  // Create user
  const user = yield* UserRepository.create({
    email: "john@example.com",
    name: "John Doe",
    passwordHash: "hashed_password",
  })

  yield* Effect.log(`Created user: ${user.id}`)

  // Find user
  const foundUser = yield* UserRepository.findById(user.id)
  yield* Effect.log(`Found user: ${foundUser.email}`)

  // Update user
  yield* UserRepository.update(user.id, { name: "Jane Doe" })

  // List users
  const users = yield* UserRepository.list(10, 0)
  yield* Effect.log(`Total users: ${users.length}`)
})

// Run with database layer
Effect.runPromise(program.pipe(Effect.provide(DatabaseLayer)))
```

---

## Docker Setup

### 1. Add PostgreSQL to your container setup

```yaml
services:
  # ... existing services ...

  postgres:
    image: postgres:16-alpine
    container_name: effect-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-myapp}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  # Update app service to depend on postgres
  app:
    # ... existing config ...
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/myapp

volumes:
  postgres_data:
    driver: local

networks:
  app-network:
    driver: bridge
```

### 2. Optional: Initialization Scripts

Create `docker/postgres/init/01-init.sql`:

```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create additional databases for testing
CREATE DATABASE myapp_test;

-- Create read-only user
CREATE USER readonly WITH PASSWORD 'readonly';
GRANT CONNECT ON DATABASE myapp TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;
```

### 3. Start PostgreSQL

```bash
# Start PostgreSQL only
docker run --rm -d --name app-postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=myapp \
  postgres:16-alpine

# Wait for health check
docker ps

# Start all services
docker build -t effect-tanstack-start .
docker run --rm -p 3000:3000 --env-file .env effect-tanstack-start

# Run migrations in Docker
docker exec <app_container> bun run db:migrate
```

---

## Database Seeding

Create `src/db/seed.ts`:

```typescript
import { Effect } from "effect"
import { db } from "./client"
import { posts, users } from "./schema"

async function seed() {
  console.log("Seeding database...")

  // Clear existing data
  await db.delete(posts)
  await db.delete(users)

  // Create users
  const [user1, user2] = await db
    .insert(users)
    .values([
      {
        email: "alice@example.com",
        name: "Alice Johnson",
        passwordHash: "hashed_password_1",
      },
      {
        email: "bob@example.com",
        name: "Bob Smith",
        passwordHash: "hashed_password_2",
      },
    ])
    .returning()

  console.log(`Created ${2} users`)

  // Create posts
  await db.insert(posts).values([
    {
      title: "First Post",
      content: "This is Alice's first post",
      authorId: user1.id,
      published: new Date(),
    },
    {
      title: "Second Post",
      content: "This is Alice's second post",
      authorId: user1.id,
    },
    {
      title: "Bob's Post",
      content: "This is Bob's post",
      authorId: user2.id,
      published: new Date(),
    },
  ])

  console.log(`Created ${3} posts`)
  console.log("Seeding completed!")
}

seed().catch((error) => {
  console.error("Seeding failed:", error)
  process.exit(1)
})
```

Run seeding:

```bash
bun run db:seed
```

---

## Testing with PostgreSQL

### 1. Test Database Setup

Create `.env.test`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp_test"
```

### 2. Test Utilities

Create `src/db/test-utils.ts`:

```typescript
import { Effect, Layer } from "effect"
import { db } from "./client"
import { DatabaseLive, DatabaseService } from "./layer"
import * as schema from "./schema"

// Create test database layer
export const TestDatabaseLayer = Layer.scoped(
  DatabaseService,
  Effect.gen(function*() {
    const testDb = db

    // Clear all tables before tests
    yield* Effect.promise(() => testDb.delete(schema.posts))
    yield* Effect.promise(() => testDb.delete(schema.users))

    return { db: testDb, client: testDb }
  }),
)

// Helper to run tests with database
export const runTestWithDb = <E, A>(
  program: Effect.Effect<A, E, DatabaseService>,
) => Effect.runPromise(program.pipe(Effect.provide(TestDatabaseLayer)))
```

### 3. Example Test

Create `src/db/repositories/users.test.ts`:

```typescript
import { beforeEach, describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { runTestWithDb } from "../test-utils"
import { UserRepository } from "./users"

describe("UserRepository", () => {
  it.effect("creates and finds user", () =>
    Effect
      .gen(function*() {
        // Create user
        const user = yield* UserRepository.create({
          email: "test@example.com",
          name: "Test User",
          passwordHash: "hashed",
        })

        expect(user.email).toBe("test@example.com")

        // Find user
        const found = yield* UserRepository.findById(user.id)
        expect(found.id).toBe(user.id)
      })
      .pipe(Effect.provide(/* TestDatabaseLayer */)))
})
```

---

## Connection Pooling

### Best Practices

```typescript
import postgres from "postgres"

const client = postgres(connectionString, {
  // Maximum number of connections
  max: 20,

  // Idle timeout in seconds
  idle_timeout: 30,

  // Connection timeout in seconds
  connect_timeout: 2,

  // Maximum lifetime of connection in seconds
  max_lifetime: 60 * 30, // 30 minutes

  // Prepared statements
  prepare: true,

  // Transform column names
  transform: {
    column: {
      to: postgres.toCamel,
      from: postgres.toSnake,
    },
  },

  // Debug mode
  debug: process.env.NODE_ENV === "development",
})
```

### Health Checks

```typescript
import { Effect } from "effect"
import { DatabaseService } from "./layer"

export const checkDatabaseHealth = Effect.gen(function*() {
  const { client } = yield* DatabaseService

  yield* Effect.tryPromise({
    try: () => client`SELECT 1`,
    catch: (error) => new Error(`Database health check failed: ${error}`),
  })

  yield* Effect.log("Database is healthy")
})
```

---

## Monitoring and Observability

### Query Logging

```typescript
import { drizzle } from "drizzle-orm/postgres-js"
import { Effect } from "effect"

const db = drizzle(client, {
  schema,
  logger: {
    logQuery(query: string, params: unknown[]) {
      Effect.runSync(
        Effect.log(`SQL: ${query}`, { params }),
      )
    },
  },
})
```

### Performance Tracking

```typescript
import { Effect } from "effect"

export const withQueryMetrics = <A, E, R>(
  queryName: string,
  effect: Effect.Effect<A, E, R>
) =>
  Effect.gen(function* () {
    const start = Date.now()
    const result = yield* effect
    const duration = Date.now() - start

    yield* Effect.log(`Query ${queryName} took ${duration}ms`)

    return result
  })

// Usage
const users = yield* withQueryMetrics(
  "findAllUsers",
  UserRepository.list()
)
```

---

## Best Practices

### 1. Schema Organization

- One file per table
- Export types for each table
- Use meaningful column names
- Add indexes for frequently queried columns

```typescript
import { index } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  // ... columns
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}))
```

### 2. Transactions

```typescript
import { Effect } from "effect"
import { DatabaseService } from "./layer"

const transferMoney = (fromId: number, toId: number, amount: number) =>
  Effect.gen(function*() {
    const { db } = yield* DatabaseService

    yield* Effect.tryPromise(() =>
      db.transaction(async (tx) => {
        // Deduct from sender
        await tx
          .update(accounts)
          .set({ balance: sql`${accounts.balance} - ${amount}` })
          .where(eq(accounts.id, fromId))

        // Add to receiver
        await tx
          .update(accounts)
          .set({ balance: sql`${accounts.balance} + ${amount}` })
          .where(eq(accounts.id, toId))
      })
    )
  })
```

### 3. Error Handling

```typescript
export const findUserOrFail = (id: number) =>
  Effect.gen(function*() {
    const user = yield* UserRepository.findById(id)

    if (!user) {
      return yield* Effect.fail({
        _tag: "UserNotFound",
        id,
      })
    }

    return user
  })
```

### 4. Timestamps

Always include created and updated timestamps:

```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // ... other fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
```

Update `updatedAt` on modifications:

```typescript
await db
  .update(users)
  .set({ name: "New Name", updatedAt: new Date() })
  .where(eq(users.id, 1))
```

---

## Troubleshooting

### Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | rg app-postgres

# View PostgreSQL logs
docker logs app-postgres

# Connect to PostgreSQL shell
docker exec -it app-postgres psql -U postgres -d myapp

# Test connection
psql $DATABASE_URL
```

### Migration Issues

```bash
# Reset database (DANGER: deletes all data)
docker stop app-postgres && docker rm app-postgres
docker run --rm -d --name app-postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=myapp \
  postgres:16-alpine
bun run db:migrate

# Check migration status
bunx drizzle-kit check

# View migration SQL
cat src/db/migrations/0000_initial.sql
```

### Common Errors

**Error: `relation "users" does not exist`**

- Run migrations: `bun run db:migrate`

**Error: `password authentication failed`**

- Check `DATABASE_URL` in `.env`
- Verify PostgreSQL is running

**Error: `ECONNREFUSED`**

- PostgreSQL is not running
- Check port is correct (5432)

---

## Production Considerations

### 1. Environment Variables

Never commit credentials:

```bash
# .env (git ignored)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### 2. SSL/TLS

```typescript
const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === "production" ? "require" : false,
})
```

### 3. Connection Limits

Calculate appropriate pool size:

```
max_connections = (CPUs × 2) + effective_spindle_count
```

For most apps: 10-20 connections per instance

### 4. Read Replicas

```typescript
const writeClient = postgres(process.env.DATABASE_WRITE_URL)
const readClient = postgres(process.env.DATABASE_READ_URL)

export const writeDb = drizzle(writeClient)
export const readDb = drizzle(readClient)
```

### 5. Backups

```bash
# Automated backup script
docker exec app-postgres pg_dump -U postgres myapp > backup.sql

# Restore
docker exec -i app-postgres psql -U postgres myapp < backup.sql
```

---

## Resources

- [Drizzle Documentation](https://orm.drizzle.team)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Effect SQL](https://effect.website/docs/guides/sql)
- [postgres.js](https://github.com/porsager/postgres)

---

## Next Steps

1. Install dependencies: `bun add drizzle-orm postgres`
2. Create schema files in `src/db/schema/`
3. Generate migrations: `bun run db:generate`
4. Update container setup with PostgreSQL service
5. Run migrations: `bun run db:migrate`
6. Start building repositories and services
7. Add tests for database operations

---

**Ready to add PostgreSQL?** Follow this guide step-by-step and you'll have a fully integrated, type-safe database layer with Effect-TS integration.
