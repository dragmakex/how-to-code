/**
 * Telemetry Example
 *
 * This file demonstrates how to use OpenTelemetry tracing, Sentry error logging,
 * Grafana Loki logging, and PostHog analytics in an Effect application.
 */

import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { createLokiLoggerLayer } from "./lib/logger-loki"
import {
  createPostHogLayer,
  identifyServerUser,
  trackServerEvent,
} from "./lib/posthog-server"
import { createSentryTelemetryLayer, initSentry } from "./lib/telemetry-server"

// ====================
// Configuration
// ====================

const TELEMETRY_CONFIG = {
  serviceName: "effect-tanstack-start",
  sentryDsn: process.env.SENTRY_DSN ?? "", // Set this in your .env file
  environment: process.env.NODE_ENV || "development",
}

const LOKI_CONFIG = {
  endpoint: process.env.LOKI_ENDPOINT
    || "http://localhost:3100/loki/api/v1/push",
  labels: {
    job: "effect-tanstack-start",
    environment: TELEMETRY_CONFIG.environment,
  },
}

const POSTHOG_CONFIG = {
  apiKey: process.env.POSTHOG_API_KEY || "phc_development_key",
  host: process.env.POSTHOG_HOST || "http://localhost:8000",
}

// ====================
// Initialize Sentry
// ====================

initSentry(TELEMETRY_CONFIG)

// ====================
// Create Layers
// ====================

// Telemetry layer for tracing (sends to Sentry)
const TelemetryLive = createSentryTelemetryLayer(TELEMETRY_CONFIG)

// Logger layer for structured logging (sends to Loki)
const LoggerLive = createLokiLoggerLayer(LOKI_CONFIG)

// PostHog layer for analytics
const PostHogLive = createPostHogLayer(POSTHOG_CONFIG)

// Combine all layers
const AppLayer = TelemetryLive.pipe(
  Layer.provideMerge(LoggerLive),
  Layer.provideMerge(PostHogLive),
)

// ====================
// Example Tasks
// ====================

// Simulate a database query
const queryDatabase = (userId: string) =>
  Effect
    .gen(function*() {
      yield* Effect.log(`Querying database for user: ${userId}`)
      yield* Effect.sleep("100 millis")

      // Simulate a random failure (10% chance)
      const shouldFail = Math.random() < 0.1
      if (shouldFail) {
        return yield* Effect.fail(new Error("Database connection timeout"))
      }

      return {
        id: userId,
        name: "John Doe",
        email: "john@example.com",
      }
    })
    .pipe(
      Effect.withSpan("queryDatabase", { attributes: { userId } }),
    )

// Simulate an API call
const callExternalAPI = (endpoint: string) =>
  Effect
    .gen(function*() {
      yield* Effect.log(`Calling external API: ${endpoint}`)
      yield* Effect.sleep("200 millis")

      return {
        status: "success",
        data: { message: "API response" },
      }
    })
    .pipe(
      Effect.withSpan("callExternalAPI", { attributes: { endpoint } }),
    )

// Simulate processing data
const processData = (_data: unknown) =>
  Effect
    .gen(function*() {
      yield* Effect.log("Processing data...")
      yield* Effect.sleep("50 millis")

      yield* Effect.logInfo("Data processed successfully")

      return { processed: true, timestamp: Date.now() }
    })
    .pipe(
      Effect.withSpan("processData"),
    )

// ====================
// Main Program
// ====================

const program = Effect
  .gen(function*() {
    yield* Effect.log("Application starting...")

    // Track application start in PostHog
    yield* trackServerEvent("application_started", {
      distinctId: "server",
      environment: TELEMETRY_CONFIG.environment,
    })

    // Query the database
    const user = yield* queryDatabase("user-456")
    yield* Effect.log(`User fetched: ${user.name}`)

    // Identify user in PostHog
    yield* identifyServerUser(user.id, {
      email: user.email,
      name: user.name,
    })

    // Track user fetch event
    yield* trackServerEvent("user_fetched", {
      distinctId: user.id,
      userName: user.name,
    })

    // Call external API
    const apiResult = yield* callExternalAPI("/api/external/data")
    yield* Effect.log(`API call completed: ${apiResult.status}`)

    // Track API call event
    yield* trackServerEvent("api_call_completed", {
      distinctId: user.id,
      endpoint: "/api/external/data",
      status: apiResult.status,
    })

    // Process the data
    const processed = yield* processData({ user, apiResult })
    yield* Effect.log(`Processing result: ${JSON.stringify(processed)}`)

    // Track processing completion
    yield* trackServerEvent("data_processed", {
      distinctId: user.id,
      processingTime: Date.now() - processed.timestamp,
    })

    yield* Effect.log("Application completed successfully")

    // Track successful completion
    yield* trackServerEvent("application_completed", {
      distinctId: user.id,
      success: true,
    })
  })
  .pipe(
    // Wrap everything in a span for the entire request
    Effect.withSpan("handleRequest"),
    // Add a log span to measure total duration
    Effect.withLogSpan("requestDuration"),
    // Make it scoped so annotateLogsScoped works
    Effect.scoped,
    Effect.catch((error) =>
      Effect.gen(function*() {
        yield* Effect.logError("Application failed", error)

        // Track error in PostHog
        yield* trackServerEvent("application_error", {
          distinctId: "server",
          error: String(error),
        })
      })
    ),
  )
  .pipe(
    Effect.annotateLogs({
      requestId: "req-123",
      version: "1.0.0",
    }),
  )

// ====================
// Run the Program
// ====================

Effect
  .runPromise(
    program.pipe(
      Effect.provide(AppLayer),
      Effect.catchCause((cause) => {
        // Log any unhandled errors
        return Effect.logError("Unhandled error", cause)
      }),
    ),
  )
  .then(
    () => {
      console.log("\n✅ Program completed successfully")
      process.exit(0)
    },
    (error) => {
      console.error("\n❌ Program failed:", error)
      process.exit(1)
    },
  )

/* eslint-disable jsdoc-js/check-indentation */
/**
 * To run this example:
 *
 * 1. Using Docker Compose (recommended):
 *    ```bash
 *    docker-compose up
 *    ```
 *
 * 2. OR start services individually:
 *
 *    a. Start Grafana Loki:
 *       ```bash
 *       docker run -p 3100:3100 grafana/loki
 *       ```
 *
 *    b. Start OpenTelemetry backend:
 *       ```bash
 *       docker run -p 3000:3000 -p 4317:4317 -p 4318:4318 --rm -it docker.io/grafana/otel-lgtm
 *       ```
 *
 *    c. Start PostHog (see docker-compose.yml for full setup)
 *
 * 3. Set environment variables (create a .env file):
 *    ```
 *    SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
 *    LOKI_ENDPOINT=http://localhost:3100/loki/api/v1/push
 *    POSTHOG_API_KEY=phc_development_key
 *    POSTHOG_HOST=http://localhost:8000
 *    NODE_ENV=development
 *    ```
 *
 * 4. Run the example:
 *    ```bash
 *    bun run src/telemetry-example.ts
 *    ```
 *
 * 5. View the results:
 *    - Grafana (Traces & Logs): http://localhost:3001
 *    - Sentry: http://localhost:9000
 *    - PostHog: http://localhost:8001
 *    - Prometheus: http://localhost:9090
 */
