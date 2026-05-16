/**
 * Pattern: Sentry Effect Integration (Effect v4)
 * Purpose: Effect-native error tracking, tracing, logs, and metrics
 *
 * Uses @sentry/effect/server for server-side integration.
 * Effect v4 API: Layer.succeed for Tracer, Logger.layer for Logger.
 *
 * **Coexistence with OTEL**: This Sentry integration works ALONGSIDE the
 * ObservabilityLive layer (OTEL → Tempo/Loki). Sentry captures errors and
 * distributed traces to Sentry backend, while OTEL sends traces/logs to
 * the Grafana LAOS stack. Both can be active simultaneously.
 *
 * @see https://github.com/getsentry/sentry-javascript/tree/develop/packages/effect
 * @see docs/guides/observability-setup.md — LAOS stack integration
 */

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
 *
 * Composes: base SDK + tracer + logger + metrics
 *
 * Pattern: Layer.mergeAll — combines multiple layers into one.
 *
 * @param config - Sentry configuration
 * @returns Layer that provides Sentry integration
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
    // Effect v4: Tracer via Layer.succeed(Tracer.Tracer, implementation)
    Layer.succeed(Tracer.Tracer, Sentry.SentryEffectTracer),
    // Effect v4: Logger via Logger.layer([loggers], { mergeWithExisting })
    Logger.layer([Sentry.SentryEffectLogger], { mergeWithExisting: true }),
    // Metrics layer (direct export from Sentry)
    Sentry.SentryEffectMetricsLayer,
  )

/**
 * Config-driven Sentry layer for server use.
 *
 * Reads SENTRY_DSN, NODE_ENV, and SENTRY_TRACES_SAMPLE_RATE from environment.
 * Returns Layer.empty if SENTRY_DSN is not configured (safe for local dev).
 *
 * Pattern: Layer.unwrap — unwrap Layer from Effect that reads config.
 */
export const SentryLive: Layer.Layer<never, Config.ConfigError> = Effect
  .gen(
    function*() {
      const dsn = yield* Config.string("SENTRY_DSN").pipe(
        Config.orElse(() => Config.succeed("")),
      )

      if (!dsn) {
        // Return empty layer if no DSN configured — safe for local development
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

/**
 * Test error program for verifying Sentry integration.
 *
 * Usage: Run this program with SentryLive provided, then check
 * http://localhost:9000 for the captured error.
 *
 * @example
 * ```typescript
 * const test = testSentryError.pipe(
 *   Effect.provide(SentryLive),
 *   Effect.runPromise
 * )
 * ```
 */
export const testSentryError = Effect
  .gen(function*() {
    yield* Effect.log("Starting Sentry test error")
    return yield* Effect.fail(new Error("Sentry Effect Integration Test Error"))
  })
  .pipe(Effect.withSpan("testSentryError"))
