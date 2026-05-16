/**
 * Client-side telemetry initialization — Sentry + PostHog.
 *
 * Call `initClient()` once from the root component. Guards against
 * server-side execution and double initialization while keeping heavy
 * telemetry SDKs out of the critical path.
 */

import * as React from "react"

let clientInitPromise: Promise<void> | null = null
let sentryInitPromise: Promise<SentryModule | null> | null = null
let posthogInitPromise: Promise<void> | null = null

type SentryModule = typeof import("@sentry/react")
type PostHogModule = typeof import("posthog-js")

const capturePostHogPageView = (posthog: PostHogModule["default"]): void => {
  posthog.capture("$pageview", {
    "$current_url": window.location.href,
  })
}

const initSentry = async (): Promise<SentryModule | null> => {
  if (!import.meta.env.VITE_SENTRY_DSN || typeof window === "undefined") {
    return null
  }

  if (sentryInitPromise) {
    return sentryInitPromise
  }

  sentryInitPromise = import("@sentry/react")
    .then((Sentry) => {
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

      return Sentry
    })
    .catch((error: unknown) => {
      sentryInitPromise = null
      throw error
    })

  return sentryInitPromise
}

const initPostHog = async (): Promise<void> => {
  if (!import.meta.env.VITE_POSTHOG_KEY || typeof window === "undefined") {
    return
  }

  if (posthogInitPromise) {
    return posthogInitPromise
  }

  posthogInitPromise = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
        api_host: import.meta.env.VITE_POSTHOG_HOST ?? "http://localhost:8001",
        capture_pageview: false,
        capture_pageleave: true,
      })

      capturePostHogPageView(posthog)
    })
    .catch((error: unknown) => {
      posthogInitPromise = null
      throw error
    })

  return posthogInitPromise
}

const reportErrorToSentry = async (
  error: Error,
  componentStack?: string | null,
): Promise<void> => {
  const Sentry = await initSentry()
  if (!Sentry) {
    return
  }

  Sentry.captureException(error, {
    extra: {
      componentStack,
    },
  })
}

/**
 * Initialize client-side observability (Sentry error tracking + PostHog analytics).
 * Safe to call multiple times and in SSR contexts (no-ops gracefully).
 *
 * @returns A promise that resolves once the configured telemetry SDKs are initialized.
 */
export function initClient(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve()
  }

  if (clientInitPromise) {
    return clientInitPromise
  }

  clientInitPromise = Promise
    .all([
      initSentry(),
      initPostHog(),
    ])
    .then(() => undefined)
    .catch((error: unknown) => {
      clientInitPromise = null
      throw error
    })

  return clientInitPromise
}

type SentryErrorBoundaryProps = {
  readonly children: React.ReactNode
  readonly fallback: React.ReactNode
}

type SentryErrorBoundaryState = {
  readonly hasError: boolean
}

/**
 * Lightweight client error boundary.
 *
 * Keeps Sentry out of the initial bundle while still reporting runtime
 * render errors once the telemetry SDK loads.
 */
export class SentryErrorBoundary extends React.Component<
  SentryErrorBoundaryProps,
  SentryErrorBoundaryState
> {
  override readonly state: SentryErrorBoundaryState = {
    hasError: false,
  }

  /**
   * Update local state after a render error.
   *
   * @returns The fallback state.
   */
  static getDerivedStateFromError(): SentryErrorBoundaryState {
    return {
      hasError: true,
    }
  }

  /**
   * Report render errors to Sentry after the SDK loads.
   *
   * @param error - The thrown render error.
   * @param info - React component stack metadata.
   */
  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    void reportErrorToSentry(error, info.componentStack)
  }

  /**
   * Render the wrapped tree or fallback UI.
   *
   * @returns The rendered subtree.
   */
  override render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}
