# Sentry Effect Integration

Complete guide to integrating `@sentry/effect` with Effect v4 for error tracking and performance monitoring.

## Overview

This integration uses `@sentry/effect` for Effect-native error tracking and distributed tracing, while maintaining coexistence with the OpenTelemetry stack (Grafana + Tempo + Loki) for full observability.

```mermaid
graph LR
    subgraph "Application Layer"
        Effect[Effect Programs]
        SentryLayer[@sentry/effect Layer]
        OTEL[OTEL Layer]
    end
    
    subgraph "Observability Backends"
        SentryBackend[Sentry<br/>Errors + Traces]
        Tempo[Tempo<br/>Traces]
        Loki[Loki<br/>Logs]
    end
    
    Effect --> SentryLayer
    Effect --> OTEL
    SentryLayer --> SentryBackend
    OTEL --> Tempo
    OTEL --> Loki
    
    style Effect fill:#4ecdc4
    style SentryBackend fill:#fa6863
    style Tempo fill:#ff6b6b
    style Loki fill:#ff6b6b
```

## Architecture

### Coexistence Pattern

| Signal | Destination    | SDK                                        | Purpose                             |
| ------ | -------------- | ------------------------------------------ | ----------------------------------- |
| Errors | Sentry         | `@sentry/effect`                           | Debugging context, stack traces     |
| Traces | Sentry + Tempo | `@sentry/effect` + `@effect/opentelemetry` | Distributed tracing in both systems |
| Logs   | Loki           | `@effect/opentelemetry`                    | Centralized log aggregation         |

**Why both?** Sentry provides rich error context and developer-friendly debugging, while the Grafana stack (Tempo/Loki) provides long-term observability and SLO monitoring.

## Installation

```bash
bun add @sentry/effect
```

## Effect v4 Configuration

Effect v4 changed the Tracer and Logger layer APIs from v3:

| v3 API            | v4 API                              |
| ----------------- | ----------------------------------- |
| `Layer.setTracer` | `Layer.succeed(Tracer.Tracer, ...)` |
| `Logger.replace`  | `Logger.layer([...])`               |

### Server-Side Integration

**File: `src/lib/sentry-effect.ts`**

```typescript
import * as Sentry from "@sentry/effect/server"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Logger from "effect/Logger"
import * as Tracer from "effect/Tracer"

export interface SentryConfig {
  readonly dsn: string
  readonly environment?: string
  readonly tracesSampleRate?: number
  readonly enableLogs?: boolean
  readonly release?: string
}

/**
 * Creates the complete Sentry layer for Effect v4.
 */
export const makeSentryLive = (config: SentryConfig): Layer.Layer<never> =>
  Layer.mergeAll(
    Sentry.effectLayer({
      dsn: config.dsn,
      environment: config.environment ?? "development",
      tracesSampleRate: config.tracesSampleRate ?? 1.0,
      enableLogs: config.enableLogs ?? true,
      release: config.release,
    }),
    // Effect v4: Tracer via Layer.succeed
    Layer.succeed(Tracer.Tracer, Sentry.SentryEffectTracer),
    // Effect v4: Logger via Logger.layer
    Logger.layer([Sentry.SentryEffectLogger], { mergeWithExisting: true }),
    // Metrics layer
    Sentry.SentryEffectMetricsLayer,
  )

/**
 * Config-driven Sentry layer. Returns Layer.empty if SENTRY_DSN not set.
 */
export const SentryLive: Layer.Layer<never, Config.ConfigError> = Effect
  .gen(
    function*() {
      const dsn = yield* Config.string("SENTRY_DSN").pipe(
        Config.orElse(() => Config.succeed("")),
      )

      if (!dsn) {
        return Layer.empty
      }

      const environment = yield* Config.string("NODE_ENV").pipe(
        Config.orElse(() => Config.succeed("development")),
      )

      const tracesSampleRate = yield* Config
        .number("SENTRY_TRACES_SAMPLE_RATE")
        .pipe(
          Config.orElse(() => Config.succeed(1.0)),
        )

      return makeSentryLive({
        dsn,
        environment,
        tracesSampleRate,
        enableLogs: true,
      })
    },
  )
  .pipe(Layer.unwrap)
```

### Wiring into Server Runtime

**File: `src/routes/api/$.ts`**

```typescript
import { SentryLive } from "@/lib/sentry-effect"

// Composition: Sentry + OTEL + Console
export const ServerRuntimeLive = TodosApplicationLive.pipe(
  Layer.provideMerge(ObservabilityRuntimeLive), // OTEL → Tempo/Loki
  Layer.provideMerge(SentryLive), // Sentry → Sentry backend
  Layer.provideMerge(DevConsoleLive), // Console for dev
)
```

## LAOS Stack Testing

### Prerequisites

Ensure you have the LAOS stack cloned and running:

```bash
# Option 1: Use the setup script
./scripts/setup-laos-test.sh

# Option 2: Manual setup
git clone https://github.com/dtechvision/laos.git ../laos
cd ../laos
docker compose up -d

# Initialize Sentry
docker compose exec sentry-web sentry upgrade --noinput
docker compose exec sentry-web sentry createuser \
  --email admin@localhost --password admin123 --superuser --no-input
```

### Environment Configuration

Use `.env.laos` for LAOS testing:

```bash
# Copy LAOS-specific environment
cp .env.laos .env
```

Or create manually:

```env
SENTRY_DSN=http://ec6dd66bd505682235c3bba04bdcdadc@localhost:9000/2
VITE_SENTRY_DSN=http://ec6dd66bd505682235c3bba04bdcdadc@localhost:9000/2
LOKI_ENDPOINT=http://localhost:3100/loki/api/v1/push
OTLP_ENDPOINT=http://localhost:4318/v1/traces
PYROSCOPE_SERVER_ADDRESS=http://localhost:4040
SERVICE_NAME=effect-tanstack-start-master
NODE_ENV=development
```

### Verification Steps

#### 1. Start Application

```bash
bun run dev
```

#### 2. Verify Services

| Service | URL                         | Check                    |
| ------- | --------------------------- | ------------------------ |
| App     | http://localhost:3000       | Running                  |
| Grafana | http://localhost:3010       | admin/admin              |
| Sentry  | http://localhost:9000       | admin@localhost/admin123 |
| Loki    | http://localhost:3100/ready | `ready`                  |
| Tempo   | http://localhost:3200/ready | `ready`                  |

#### 3. Test Sentry Integration

**GET endpoint (status check):**

```bash
curl http://localhost:3000/api/sentry-test
```

**POST endpoint (trigger error):**

```bash
curl -X POST http://localhost:3000/api/sentry-test
```

**Expected response:**

```json
{
  "status": "error_triggered",
  "message": "Test error was triggered and should be in Sentry",
  "error": "Sentry Effect Integration Test Error",
  "verification": {
    "sentry_url": "http://localhost:9000",
    "project": "effect-tanstack-start",
    "instructions": "Check Sentry issues for 'Sentry Effect Integration Test Error'"
  }
}
```

#### 4. Verify in Sentry

1. Open http://localhost:9000
2. Login with `admin@localhost` / `admin123`
3. Navigate to Projects → effect-tanstack-start
4. Check Issues for the test error

#### 5. Verify in Grafana

1. Open http://localhost:3010
2. **Traces:** Explore → Tempo → Search for service `effect-tanstack-start`
3. **Logs:** Explore → Loki → Query `{service_name="effect-tanstack-start"}`

## Verification Commands

```bash
# Check Loki logs
curl -G http://localhost:3100/loki/api/v1/query \
  --data-urlencode 'query={service_name="effect-tanstack-start"}'

# Check Tempo traces (via Grafana UI)
# http://localhost:3010 → Explore → Tempo

# Check Sentry health
curl http://localhost:9000/_health/

# Trigger test error
curl -X POST http://localhost:3000/api/sentry-test
```

## Troubleshooting

### No Errors in Sentry

1. **Check DSN:** Verify `SENTRY_DSN` in `.env` matches your Sentry project
2. **Check layer composition:** Ensure `SentryLive` is in `ServerRuntimeLive`
3. **Check Sentry is running:** `curl http://localhost:9000/_health/`

### No Traces in Tempo

1. **Verify OTLP endpoint:** `curl http://localhost:4318/v1/traces` (should return 405 for GET)
2. **Check ObservabilityLive:** Ensure layer is provided to routes
3. **Add spans:** Ensure `Effect.withSpan` is used on service methods

### No Logs in Loki

1. **Check Loki endpoint:** `curl -X POST http://localhost:3100/otlp/v1/logs`
2. **Wait for batch:** Logs are batched, wait ~5 seconds after request
3. **Verify labels:** Query with `{service_name="effect-tanstack-start"}`

### Port Conflicts

```bash
# Check what's using the ports
lsof -i :3010 -i :9000 -i :3100 -i :3200 -i :4040

# Reset LAOS stack
cd ../laos
docker compose down -v && docker compose up -d
```

## Migration from @sentry/node

If migrating from imperative `@sentry/node` to Effect-native `@sentry/effect`:

1. **Keep both during transition:** The imperative `Sentry.init()` can coexist with `SentryLive`
2. **Replace gradually:** Move Effect-native code to use `SentryLive`, keep imperative for non-Effect code
3. **Eventually remove:** Once all code paths use Effect, remove `Sentry.init()`

## References

- [Sentry Effect SDK](https://github.com/getsentry/sentry-javascript/tree/develop/packages/effect)
- [Sentry Effect Docs](https://docs.sentry.io/platforms/javascript/guides/effect/)
- [LAOS Stack](https://github.com/dtechvision/laos)
- [Effect v4 Migration](./effect-v4-migration.md)
