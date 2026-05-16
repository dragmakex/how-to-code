/**
 * Client-Side Telemetry Configuration
 *
 * This file configures Sentry for browser-side error logging and performance monitoring.
 * It integrates with React for component-level error tracking.
 */

import * as Sentry from "@sentry/react"

/**
 * Configuration options for client-side telemetry
 */
export interface ClientTelemetryConfig {
  sentryDsn?: string
  environment?: string
  tracesSampleRate?: number
  replaysSessionSampleRate?: number
  replaysOnErrorSampleRate?: number
}

/**
 * Initialize Sentry for the React application
 * @param config - The client telemetry configuration.
 */
export function initClientSentry(config: ClientTelemetryConfig) {
  if (!config.sentryDsn) {
    console.warn("Sentry DSN not provided, skipping Sentry initialization")
    return
  }

  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.environment || "development",

    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate || 1.0, // Adjust in production (0.1 = 10% sampling)

    // Session Replay
    replaysSessionSampleRate: config.replaysSessionSampleRate || 0.1, // 10% of sessions
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate || 1.0, // 100% of errors

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
  })
}

/**
 * Wrap your app with Sentry's Error Boundary for React component error tracking
 *
 * Example usage:
 *
 * ```tsx
 * import { SentryErrorBoundary } from "./lib/telemetry-client"
 *
 * function App() {
 *   return (
 *     <SentryErrorBoundary fallback={<ErrorFallback />}>
 *       <YourApp />
 *     </SentryErrorBoundary>
 *   )
 * }
 * ```
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary

/**
 * Higher-order component to profile React component performance
 *
 * Example usage:
 *
 * ```tsx
 * import { withSentryProfiler } from "./lib/telemetry-client"
 *
 * const MyComponent = () => <div>Hello World</div>
 *
 * export default withSentryProfiler(MyComponent, { name: "MyComponent" })
 * ```
 */
export const withSentryProfiler = Sentry.withProfiler

/**
 * Manually capture exceptions
 *
 * Example usage:
 *
 * ```ts
 * import { captureException, captureMessage } from "./lib/telemetry-client"
 *
 * try {
 *   // Your code
 * } catch (error) {
 *   captureException(error)
 * }
 *
 * captureMessage("Something important happened", "info")
 * ```
 */
export const captureException = Sentry.captureException
export const captureMessage = Sentry.captureMessage

/**
 * Set user context for error tracking
 *
 * Example usage:
 *
 * ```ts
 * import { setUser } from "./lib/telemetry-client"
 *
 * setUser({
 *   id: "user-123",
 *   email: "user@example.com",
 *   username: "john_doe",
 * })
 * ```
 */
export const setUser = Sentry.setUser

/**
 * Create custom spans for performance tracking
 *
 * Example usage:
 *
 * ```ts
 * import { startSpan } from "./lib/telemetry-client"
 *
 * await startSpan({
 *   name: "fetch-user-data",
 *   op: "http.client",
 * }, async () => {
 *   const response = await fetch("/api/user")
 *   return response.json()
 * })
 * ```
 */
export const startSpan = Sentry.startSpan
