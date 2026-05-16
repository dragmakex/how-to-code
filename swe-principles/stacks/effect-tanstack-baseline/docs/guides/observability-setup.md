# Infrastructure Setup - Observability & Deployment

Atomic, verifiable tasks to set up complete observability infrastructure.

---

## LAOS Policy (Required)

- LAOS is **never vendored** into this repo and must **not** appear in git history here.
- Always use LAOS from the upstream git repo: `https://github.com/dtechvision/laos`.
- Any fixes or improvements to the stack must be **upstreamed to LAOS**, not patched locally.
- See LAOS `docs/APP-WIRING.md` for the condensed app integration guide.

## Quick Start (Experienced Engineers)

```bash
# 1. Start LAOS stack (external repo)
# https://github.com/dtechvision/laos
git clone https://github.com/dtechvision/laos.git ../laos
cd ../laos
./scripts/laos-bootstrap.sh --app /path/to/this/repo --write-app-env

# 2. Verify
curl http://localhost:3100/ready  # Loki
curl http://localhost:3200/ready  # Tempo
curl http://localhost:9090/-/ready  # Prometheus
curl http://localhost:4040/ready  # Pyroscope

# 3. Wire into app (see Phase 2-3 below)
```

---

## Architecture Summary

```
Frontend (React)                         Backend (Effect-TS)
├── Sentry (errors + replay)             ├── NodeSdk.layer() → Tempo (traces via OTLP)
├── PostHog (analytics + flags)          │                   → Loki (logs via OTLP)
└── PostHog (session recording)          ├── Pyroscope (CPU + memory profiling)
                                         ├── Sentry (errors)
                                         └── PostHog (server events)
```

**Tool Responsibilities:**

- **Grafana** → "Is it broken?" (system health, SLOs)
- **Sentry** → "Why is it broken?" (errors, stack traces)
- **Pyroscope** → "What's slow?" (CPU, memory, performance bottlenecks)
- **PostHog** → "What did it do to users?" (funnels, replay)

---

## Phase 1: Infrastructure (LAOS)

### 1.1 Start LAOS

```bash
git clone https://github.com/dtechvision/laos.git ../laos
cd ../laos
docker compose up -d
```

**Verify:** `docker compose ps` → all services running/healthy (~2-3 min for full startup)

- [ ] Done

### 1.2 Verify Grafana Stack

| Service    | URL                           | Check               |
| ---------- | ----------------------------- | ------------------- |
| Grafana    | http://localhost:3010         | Login (admin/admin) |
| Loki       | http://localhost:3100/ready   | `ready`             |
| Tempo      | http://localhost:3200/ready   | `ready`             |
| Prometheus | http://localhost:9090/-/ready | `ready`             |
| Pyroscope  | http://localhost:4040/ready   | `ready`             |

- [ ] Done

### 1.3 Initialize Sentry

```bash
docker compose exec sentry-web sentry upgrade --noinput
docker compose exec sentry-web sentry createuser \
  --email admin@localhost --password admin123 --superuser --no-input
```

**Verify:** http://localhost:9000 → login works

- [ ] Done

### 1.4 Configure Sentry Project

1. Login to http://localhost:9000
2. Create Organization → Create Project (JavaScript/React)
3. Copy DSN from project settings
4. Add to `.env`:
   ```bash
   SENTRY_DSN=http://YOUR_KEY@localhost:9000/1
   VITE_SENTRY_DSN=http://YOUR_KEY@localhost:9000/1
   ```

- [ ] Done

### 1.5 Configure PostHog

1. Open http://localhost:8001
2. Complete setup wizard
3. Copy Project API Key
4. Add to `.env`:
   ```bash
   VITE_POSTHOG_KEY=phc_YOUR_KEY
   VITE_POSTHOG_HOST=http://localhost:8001
   ```

- [ ] Done

---

## Phase 2: Server Observability (Effect Native)

> **Key:** Traces go to Tempo via `OTLP_ENDPOINT`. Logs go to Loki via `LOKI_OTLP_ENDPOINT`. Both use OTLP protocol. A single `NodeSdk.layer` configures both.

### 2.1 Create Observability Module

**Create:** `src/lib/observability.ts`

```typescript
/**
 * Unified server observability — traces, logs via OTLP.
 *
 * Traces → Tempo (via OTLP_ENDPOINT)
 * Logs   → Loki  (via LOKI_OTLP_ENDPOINT)
 *
 * All config sourced through effect/Config.
 */
import * as NodeSdk from "@effect/opentelemetry/NodeSdk"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"

export const ObservabilityLive = NodeSdk.layer(
  Effect.gen(function*() {
    const traceEndpoint = yield* Config.string("OTLP_ENDPOINT").pipe(
      Config.orElse(() => Config.succeed("http://localhost:4318")),
    )
    const lokiOtlpEndpoint = yield* Config.string("LOKI_OTLP_ENDPOINT").pipe(
      Config.orElse(() => Config.succeed("http://localhost:3100/otlp")),
    )
    const serviceName = yield* Config.string("SERVICE_NAME").pipe(
      Config.orElse(() => Config.succeed("effect-tanstack-start")),
    )
    const environment = yield* Config.string("NODE_ENV").pipe(
      Config.orElse(() => Config.succeed("development")),
    )

    return {
      resource: {
        serviceName,
        serviceVersion: process.env.npm_package_version ?? "0.0.0",
        attributes: { "deployment.environment": environment },
      },
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({ url: `${traceEndpoint}/v1/traces` }),
      ),
      logRecordProcessor: new BatchLogRecordProcessor(
        new OTLPLogExporter({ url: `${lokiOtlpEndpoint}/v1/logs` }),
      ),
    }
  }),
)
```

**Why two endpoints:** Tempo (port 4318) handles traces only. Loki (port 3100) has its own OTLP receiver at `/otlp/v1/logs`. They are separate services.

**Config convention:** All runtime config flows through `effect/Config`, not `process.env`. The sole exception is `process.env.npm_package_version` — a build-time constant injected by the package manager, not a runtime configuration value.

**Verify:** `bun run typecheck`

- [ ] Done

### 2.2 Create Server Entry

**Create:** `src/lib/server-init.ts`

**`process.env` note:** Sentry's `init()` is an imperative SDK call that runs outside the Effect runtime, before any Effect program starts. `effect/Config` is not available here. This is acceptable for one-time startup calls. If you prefer full Effect-native config, wrap the init in `Effect.gen` with `Config.string` and run it via `Effect.runSync` at startup.

```typescript
/**
 * Server-side initialization — call once at startup.
 * Sentry for error tracking (separate from OTLP observability).
 */
import * as Sentry from "@sentry/node"

let initialized = false

export function initServer(): void {
  if (initialized) {
    return
  }

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: 1.0,
    })
  }

  initialized = true
}
```

- [ ] Done

### 2.3 Wire into API Runtime

In your server entry point (e.g., `src/routes/api/$.ts`):

```typescript
import { ObservabilityLive } from "@/lib/observability"
import { initServer } from "@/lib/server-init"

// Initialize Sentry at startup
initServer()

// Provide ObservabilityLive to all route layers
export const AllRoutes = Layer
  .mergeAll(RpcRouter, HttpApiRouter, HealthRoute)
  .pipe(Layer.provideMerge(ObservabilityLive))
```

**Important:** Use `Layer.provideMerge`, not `Layer.provide`. The OTLP tracer and logger must be merged into the runtime output — `Layer.provide` only satisfies dependencies without activating the logger/tracer.

If you want console output during development alongside OTLP:

```typescript
// NODE_ENV is read at module load time as a static build-time decision,
// not as runtime config. This is acceptable — it determines layer
// composition, not business logic.
const DevConsoleLive = process.env.NODE_ENV === "development"
  ? Logger.layer([Logger.consolePretty()], { mergeWithExisting: true })
  : Layer.empty

export const AllRoutes = Layer
  .mergeAll(RpcRouter, HttpApiRouter, HealthRoute)
  .pipe(
    Layer.provideMerge(ObservabilityLive),
    Layer.provideMerge(DevConsoleLive),
  )
```

- [ ] Done

### 2.4 Add Spans to Service Methods

Without spans, traces are empty. Add `Effect.withSpan` to every public service method and repository operation:

```typescript
// Service layer — wrap each method
return {
  list: repository.list.pipe(
    Effect.withSpan("TodosApp.list"),
  ),
  create: (input: CreateTodoInput): Effect.Effect<Todo> =>
    repository.create(input).pipe(
      Effect.withSpan("TodosApp.create", {
        attributes: { "todo.title": input.title },
      }),
    ),
  // ... same pattern for getById, update, remove
}
```

```typescript
// Repository layer — wrap each CRUD operation
return {
  list: Effect
    .promise(() => queries.listRows().then((rows) => rows.map(toTodo)))
    .pipe(Effect.withSpan("TodosRepository.list")),
  create: (input: CreateTodoInput) =>
    Effect
      .gen(function*() {
        // ... insert logic
      })
      .pipe(
        Effect.withSpan("TodosRepository.create", {
          attributes: { "todo.title": input.title },
        }),
      ),
  // ... same pattern for getById, update, remove
}
```

This produces a trace waterfall like:

```
RPC todos_create (50ms)
└── TodosApp.create (48ms)
    └── TodosRepository.create (45ms)
```

- [ ] Done

### 2.5 Verify Server Observability

1. Start app: `bun run dev`
2. Make requests: `curl http://localhost:3000/api/todos`
3. Check Grafana (http://localhost:3010):
   - **Tempo:** Search for service `effect-tanstack-start` → traces with nested spans
   - **Loki:** Query `{service_name="effect-tanstack-start"}` → logs with `trace_id` and `span_id`

- [ ] Traces visible in Tempo
- [ ] Logs visible in Loki
- [ ] Logs contain `trace_id` for correlation

---

## Phase 3: Client Observability

### 3.1 Create Client Init Module

> **Config note:** Client-side code runs in the browser where `effect/Config` is not available at init time. `import.meta.env.VITE_*` values are build-time constants injected by Vite — they are not runtime `process.env` reads. This is standard for browser SDKs.

**Create:** `src/lib/client-init.ts`

```typescript
/**
 * Client-side telemetry — Sentry + PostHog.
 * Call once from root component. Guards against SSR and double init.
 */
import * as Sentry from "@sentry/react"
import posthog from "posthog-js"

let initialized = false

export function initClient(): void {
  if (initialized || typeof window === "undefined") {
    return
  }

  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
    })
  }

  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST ?? "http://localhost:8001",
      capture_pageview: true,
      capture_pageleave: true,
    })
  }

  initialized = true
}

export const SentryErrorBoundary = Sentry.ErrorBoundary
```

- [ ] Done

### 3.2 Wire into Root Route

**Edit:** `src/routes/__root.tsx`

```typescript
import { initClient, SentryErrorBoundary } from "@/lib/client-init"

// Initialize on client
if (typeof window !== "undefined") {
  initClient()
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <SentryErrorBoundary
          fallback={
            <div>
              Something went wrong
            </div>
          }
        >
          <RegistryProvider defaultIdleTTL={60_000}>
            {children}
          </RegistryProvider>
        </SentryErrorBoundary>
        <Scripts />
      </body>
    </html>
  )
}
```

- [ ] Done

### 3.3 Verify Client Observability

1. Open http://localhost:3000
2. Check browser console for init messages
3. Trigger test error: `throw new Error("Test")`
4. Check:
   - **Sentry** (http://localhost:9000): Error appears
   - **PostHog** (http://localhost:8001): Pageview event appears

- [ ] Errors in Sentry
- [ ] Events in PostHog

---

## Phase 4: Continuous Profiling (Pyroscope)

> **Goal:** Profile CPU and memory usage to identify performance bottlenecks.
> **Note:** Pyroscope profiling works on Bun via `@pyroscope/nodejs` with `DATADOG_PPROF_RUNTIME=bun`.

### 4.1 Install Pyroscope SDK

```bash
bun add @pyroscope/nodejs
```

- [ ] Done

### 4.2 Initialize Pyroscope at Startup

Use the Effect-native `pyroscope-server.ts` module (already in the template) or initialize directly:

```typescript
// In your server entry point ($.ts)
import {
  initPyroscopeServer,
  shutdownPyroscopeServer,
} from "@/lib/pyroscope-server"

await initPyroscopeServer()

// On shutdown
globalHmr.__EFFECT_DISPOSE__ = async () => {
  await shutdownPyroscopeServer()
  await dispose()
}
```

**Add to `.env`:**

```bash
PYROSCOPE_SERVER_ADDRESS=http://localhost:4040
SERVICE_NAME=effect-tanstack-start
```

- [ ] Done

### 4.3 Verify Profiling

1. Start app: `bun run dev`
2. Generate load
3. Open Grafana → Explore → Pyroscope datasource
4. Select your app from the dropdown
5. Choose profile type: `process_cpu`, `memory`, or `wall`

- [ ] Profiles visible in Grafana/Pyroscope

---

## Phase 5: Database Instrumentation

> **Goal:** See query performance in traces.

### 5.1 Install PG Instrumentation

```bash
bun add @opentelemetry/instrumentation-pg
```

- [ ] Done

### 5.2 Add to Server Init

**Edit:** `src/lib/server-init.ts`

```typescript
import { registerInstrumentations } from "@opentelemetry/instrumentation"
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg"

export function initServer() {
  if (initialized) {
    return
  }

  // Database instrumentation (before Sentry)
  registerInstrumentations({
    instrumentations: [
      new PgInstrumentation({
        enhancedDatabaseReporting: true,
      }),
    ],
  })

  // ... rest of init
}
```

**What you get in traces:**

- `db.statement` - Sanitized SQL
- `db.operation` - SELECT/INSERT/UPDATE/DELETE
- `db.sql.table` - Table name
- Duration per query

- [ ] Done

### 5.3 Verify Database Instrumentation

1. Make requests that hit the database
2. Check Grafana/Tempo: DB spans appear within request traces

- [ ] DB spans visible in traces

---

## Phase 6: Deployment (Railway)

### 6.1 Create Health Endpoint

**Create:** `src/routes/api/health.ts`

```typescript
import { createAPIFileRoute } from "@tanstack/react-start/api"

export const APIRoute = createAPIFileRoute("/api/health")({
  GET: async () =>
    Response.json({ status: "ok", timestamp: new Date().toISOString() }),
})
```

- [ ] Done

### 6.2 Create Dockerfile

**Create:** `Dockerfile`

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["bun", "run", ".output/server/index.mjs"]
```

- [ ] Done

### 6.3 Configure Production Environment

```bash
railway variables set NODE_ENV=production
railway variables set SENTRY_DSN="https://...@sentry.io/..."
railway variables set VITE_SENTRY_DSN="https://...@sentry.io/..."
railway variables set VITE_POSTHOG_KEY="phc_..."
railway variables set VITE_POSTHOG_HOST="https://app.posthog.com"
railway variables set OTLP_ENDPOINT="https://your-grafana-cloud-otlp-endpoint"
railway variables set LOKI_OTLP_ENDPOINT="https://your-grafana-cloud-loki-otlp-endpoint"
```

**Note:** For production, use cloud-hosted services:

- Sentry Cloud (sentry.io)
- PostHog Cloud (app.posthog.com)
- Grafana Cloud (for OTLP endpoints)

- [ ] Done

---

## Verification Checklist

Run after completing all phases:

```bash
bun run typecheck && bun run lint && bun run test
```

### End-to-End Data Flow

| Signal         | Check                          | Location             |
| -------------- | ------------------------------ | -------------------- |
| Traces         | Request spans with child spans | Grafana → Tempo      |
| Logs           | Structured entries + trace_id  | Grafana → Loki       |
| Metrics        | Counter/gauge values           | Grafana → Prometheus |
| Profiles       | CPU/memory flame graphs        | Grafana → Pyroscope  |
| Errors         | Test error captured            | Sentry               |
| Analytics      | Pageview event                 | PostHog              |
| Session Replay | Recording available            | PostHog              |

### Quick Verification Commands

```bash
# Loki logs (with trace correlation)
curl -G http://localhost:3100/loki/api/v1/query \
  --data-urlencode 'query={service_name="effect-tanstack-start"}'

# Tempo traces
# http://localhost:3010 → Explore → Tempo → Search for service

# Prometheus metrics
curl http://localhost:9090/api/v1/query?query=up

# Pyroscope profiles
curl http://localhost:4040/ready
```

- [ ] All signals flowing

---

## Troubleshooting

### No Traces in Tempo

1. Check OTLP endpoint: `curl http://localhost:4318/v1/traces` (should return 405 for GET)
2. Verify `OTLP_ENDPOINT` in `.env` has no path suffix (just `http://localhost:4318`)
3. Ensure `ObservabilityLive` is provided to your route layers
4. Verify you have `Effect.withSpan` calls on service methods

### No Logs in Loki

1. Check Loki OTLP endpoint: `curl -X POST http://localhost:3100/otlp/v1/logs` (should accept POST)
2. Verify `LOKI_OTLP_ENDPOINT` in `.env` is set to `http://localhost:3100/otlp`
3. Ensure `allow_structured_metadata: true` is in Loki config (LAOS default)
4. Logs batch — wait ~5 seconds after generating traffic

### No Profiles in Pyroscope

1. Verify server is ready: `curl http://localhost:4040/ready`
2. Check `PYROSCOPE_SERVER_ADDRESS` is set in `.env`
3. Verify app startup logs show `[Pyroscope] started`

### Docker Stack Issues

```bash
# Port conflicts
lsof -i :3010 -i :9000 -i :8001

# Reset everything (in LAOS repo)
docker compose down -v && docker compose up -d

# Check logs
docker compose logs -f loki
docker compose logs -f tempo
```

### Sentry Not Receiving

1. Verify DSN in `.env`
2. Check network: `curl http://localhost:9000/api/0/`
3. Check browser console for Sentry errors

### PostHog Not Receiving

1. Verify API key in `.env`
2. Enable debug: `posthog.debug()` in console
3. Check Kafka health: `docker compose logs posthog-kafka`

---

## Reference: Environment Variables

```bash
# .env template
NODE_ENV=development

# Sentry
SENTRY_DSN=
VITE_SENTRY_DSN=
# SENTRY_SECRET_KEY is managed by LAOS

# PostHog
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=http://localhost:8001
# POSTHOG_SECRET_KEY is managed by LAOS

# Grafana Stack — Traces (Tempo)
OTLP_ENDPOINT=http://localhost:4318

# Grafana Stack — Logs (Loki OTLP receiver)
LOKI_OTLP_ENDPOINT=http://localhost:3100/otlp

# Pyroscope (Continuous Profiling)
PYROSCOPE_SERVER_ADDRESS=http://localhost:4040
SERVICE_NAME=effect-tanstack-start

# Database (if applicable)
DATABASE_URL=
```

---

## Reference: File Structure

```
src/lib/
├── observability.ts     # NodeSdk.layer() — traces (Tempo) + logs (Loki)
├── server-init.ts       # Server startup — Sentry init
├── client-init.ts       # Client startup — Sentry + PostHog
└── pyroscope-server.ts  # Pyroscope continuous profiling (Effect-native)

# Observability stack lives in:
# https://github.com/dtechvision/laos
# See LAOS docs/APP-WIRING.md for the condensed integration guide
```
