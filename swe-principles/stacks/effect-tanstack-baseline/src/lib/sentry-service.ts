/**
 * Sentry Test Service
 *
 * Pattern: Service Module
 * Purpose: Provide Sentry test functionality as a service, keeping route handlers
 * thin and delegating to typed service modules.
 */

import * as Effect from "effect/Effect"

/**
 * Handles the Sentry test POST request by triggering a test error.
 *
 * This error will be captured by Sentry via the SentryLive layer and should
 * appear in the Sentry dashboard at http://localhost:9000.
 */
export const handleSentryTestPost = Effect
  .gen(function*() {
    yield* Effect.log("Triggering Sentry test error")
    return yield* Effect.fail(new Error("Sentry Effect Integration Test Error"))
  })
  .pipe(Effect.withSpan("sentry-test-error"))
