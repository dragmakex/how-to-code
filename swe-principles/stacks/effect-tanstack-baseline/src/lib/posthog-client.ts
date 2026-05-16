/**
 * PostHog Client-Side Integration
 *
 * This file configures PostHog for browser-side analytics, feature flags,
 * and session recording.
 */

import posthog from "posthog-js"

/**
 * Configuration options for PostHog client
 */
export interface PostHogClientConfig {
  apiKey: string
  apiHost?: string
  enableSessionRecording?: boolean
  enableAutocapture?: boolean
  enablePerformanceCapture?: boolean
  debugMode?: boolean
}

/**
 * Initialize PostHog for the React application
 * @param config - The PostHog client configuration.
 */
export function initPostHog(config: PostHogClientConfig) {
  if (typeof window === "undefined") {
    console.warn("PostHog cannot be initialized on the server")
    return
  }

  if (!config.apiKey) {
    console.warn("PostHog API key not provided, skipping initialization")
    return
  }

  posthog.init(config.apiKey, {
    "api_host": config.apiHost || "https://app.posthog.com",

    // Session recording
    "disable_session_recording": config.enableSessionRecording === false,

    // Autocapture events (clicks, page views, etc.)
    autocapture: config.enableAutocapture !== false,

    // Performance monitoring
    "capture_performance": config.enablePerformanceCapture !== false,
    "capture_pageview": true,
    "capture_pageleave": true,

    // Privacy
    "respect_dnt": true,
    "disable_persistence": false,

    // Debug mode
    loaded: (ph) => {
      if (config.debugMode) {
        ph.debug()
      }
    },

    // Advanced options
    persistence: "localStorage+cookie",
    "cross_subdomain_cookie": false,
  })
}

/**
 * Identify a user in PostHog
 *
 * Example usage:
 * ```ts
 * import { identifyUser } from "./lib/posthog-client"
 *
 * identifyUser({
 *   userId: "user-123",
 *   email: "user@example.com",
 *   name: "John Doe",
 *   plan: "pro",
 * })
 * ```
 * @param params - The user properties to identify with.
 * @param params.userId - The unique ID of the user.
 * @param params.email - (Optional) The email of the user.
 * @param params.name - (Optional) The name of the user.
 */
export function identifyUser(params: {
  userId: string
  email?: string
  name?: string
  [key: string]: unknown
}) {
  const { userId, ...properties } = params
  posthog.identify(userId, properties)
}

/**
 * Track a custom event
 *
 * Example usage:
 * ```ts
 * import { trackEvent } from "./lib/posthog-client"
 *
 * trackEvent("button_clicked", {
 *   button_id: "signup_button",
 *   page: "/landing",
 * })
 * ```
 * @param eventName - The name of the event to track.
 * @param properties - (Optional) Additional properties for the event.
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>,
) {
  posthog.capture(eventName, properties)
}

/**
 * Track a page view
 *
 * This is usually done automatically, but you can manually track page views
 * in single-page applications when the route changes.
 *
 * Example usage:
 * ```ts
 * import { trackPageView } from "./lib/posthog-client"
 *
 * trackPageView("/dashboard")
 * ```
 * @param path - (Optional) The path of the page viewed. Defaults to `window.location.href`.
 */
export function trackPageView(path?: string) {
  posthog.capture("$pageview", {
    "$current_url": path || window.location.href,
  })
}

/**
 * Reset PostHog state (useful on logout)
 *
 * Example usage:
 * ```ts
 * import { resetPostHog } from "./lib/posthog-client"
 *
 * function handleLogout() {
 *   resetPostHog()
 *   // ... rest of logout logic
 * }
 * ```
 * @returns {void}
 */
export function resetPostHog() {
  posthog.reset()
}

/**
 * Get a feature flag value
 *
 * Example usage:
 * ```ts
 * import { getFeatureFlag } from "./lib/posthog-client"
 *
 * const newDesignEnabled = getFeatureFlag("new_design")
 *
 * if (newDesignEnabled) {
 *   // Show new design
 * }
 * ```
 * @param flagKey - The key of the feature flag.
 * @returns The value of the feature flag.
 */
export function getFeatureFlag(flagKey: string): boolean | string | undefined {
  return posthog.getFeatureFlag(flagKey)
}

/**
 * Check if a feature flag is enabled
 *
 * Example usage:
 * ```ts
 * import { isFeatureFlagEnabled } from "./lib/posthog-client"
 *
 * if (isFeatureFlagEnabled("new_dashboard")) {
 *   // Show new dashboard
 * }
 * ```
 * @param flagKey - The key of the feature flag.
 * @returns True if the feature flag is enabled, false otherwise.
 */
export function isFeatureFlagEnabled(flagKey: string): boolean {
  return posthog.isFeatureEnabled(flagKey) ?? false
}

/**
 * Wait for feature flags to load
 *
 * Example usage:
 * ```ts
 * import { onFeatureFlags } from "./lib/posthog-client"
 *
 * onFeatureFlags(() => {
 *   if (isFeatureFlagEnabled("beta_feature")) {
 *     // Initialize beta feature
 *   }
 * })
 * ```
 * @param callback - The callback function to execute once feature flags are loaded.
 */
export function onFeatureFlags(callback: () => void) {
  posthog.onFeatureFlags(callback)
}

/**
 * Set user properties
 *
 * Example usage:
 * ```ts
 * import { setUserProperties } from "./lib/posthog-client"
 *
 * setUserProperties({
 *   plan: "premium",
 *   beta_tester: true,
 * })
 * ```
 * @param properties - The user properties to set.
 */
export function setUserProperties(properties: Record<string, unknown>) {
  posthog.people.set(properties)
}

/**
 * Start a session recording
 * @returns {void}
 */
export function startSessionRecording() {
  posthog.startSessionRecording()
}

/**
 * Stop a session recording
 * @returns {void}
 */
export function stopSessionRecording() {
  posthog.stopSessionRecording()
}

/**
 * Export the PostHog instance for advanced usage
 */
export {
  posthog,
}
