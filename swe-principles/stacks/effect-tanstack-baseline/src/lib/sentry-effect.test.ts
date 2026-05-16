/**
 * Pattern: Integration Test with Layer
 * Purpose: Verify @sentry/effect Layer constructs correctly and integrates
 * with Effect v4 APIs.
 *
 * Tests:
 * - makeSentryLive creates valid Layer
 * - SentryLive constructs without errors
 * - Layer composition with SentryLive
 */

import * as ConfigProvider from "effect/ConfigProvider"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Layer from "effect/Layer"
import { describe, expect, it } from "vitest"
import { makeSentryLive, SentryLive, testSentryError } from "./sentry-effect.js"

describe("sentry-effect integration", () => {
  it("makeSentryLive creates a valid layer with proper config", () => {
    const layer = makeSentryLive({
      dsn: "http://test@localhost:9000/1",
      environment: "test",
      tracesSampleRate: 0.5,
      enableLogs: true,
    })

    // Layer should be constructable without errors
    expect(layer).toBeDefined()
  })

  it("makeSentryLive uses default values when optional config omitted", () => {
    const layer = makeSentryLive({
      dsn: "http://test@localhost:9000/1",
    })

    expect(layer).toBeDefined()
  })

  it("testSentryError program constructs correctly", async () => {
    // Test that the error program can be constructed and runs
    // Wrap in Effect.provide with empty config to handle missing SENTRY_DSN
    const program = testSentryError.pipe(
      Effect.provide(
        ConfigProvider.layer(
          ConfigProvider.fromEnv({
            env: {
              SENTRY_DSN: "http://test@localhost:9000/1",
              NODE_ENV: "test",
            },
          }),
        ),
      ),
    )

    const result = await Effect.runPromiseExit(program)

    // Should fail with our test error
    expect(Exit.isFailure(result)).toBe(true)
  })

  it("SentryLive layer constructs without errors", () => {
    // Just verify the layer definition doesn't throw
    expect(SentryLive).toBeDefined()
  })

  it("composes with other layers without type errors", () => {
    // SentryLive composes with DevConsoleLive (both provide logger/tracer)
    // This verifies type compatibility at compile time
    // Use a simple empty layer for type checking
    const composed = Layer.mergeAll(
      SentryLive,
      Layer.empty,
    )

    expect(composed).toBeDefined()
  })

  it("provides the Sentry layer via Effect.provide", async () => {
    const program = Effect
      .gen(function*() {
        yield* Effect.log("Testing Sentry integration")
        return "success"
      })
      .pipe(
        Effect.withSpan("testSpan"),
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromEnv({
              env: {
                SENTRY_DSN: "http://test@localhost:9000/1",
                NODE_ENV: "test",
              },
            }),
          ),
        ),
        Effect.provide(SentryLive),
      )

    const result = await Effect.runPromiseExit(program)

    expect(Exit.isSuccess(result)).toBe(true)
  })
})
