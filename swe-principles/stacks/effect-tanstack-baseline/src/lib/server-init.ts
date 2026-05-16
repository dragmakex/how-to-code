/**
 * Server-side initialization — call once at startup before handling requests.
 *
 * Initializes Sentry for error tracking. Pyroscope profiling is handled
 * separately via `pyroscope-server.ts` (Effect-native, Config-driven).
 */

import * as Sentry from "@sentry/node"

let initialized = false

/**
 * Initialize server-side observability singletons.
 * Safe to call multiple times — only the first call takes effect.
 */
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
