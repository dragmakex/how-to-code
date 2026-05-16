/**
 * PostHog Server-Side Integration
 *
 * This file configures PostHog for server-side event tracking and feature flags.
 */

import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { PostHog } from "posthog-node"

/**
 * Configuration options for PostHog server
 */
export interface PostHogServerConfig {
  apiKey: string
  host?: string
  enableDebug?: boolean
}

/**
 * PostHog service tag
 */
export class PostHogService extends Context.Service<PostHogService, {
  readonly client: PostHog
}>()("PostHogService") {}

/**
 * Create a PostHog client instance
 * @param config - The PostHog server configuration.
 * @returns A PostHog client instance.
 */
export function createPostHogClient(config: PostHogServerConfig): PostHog {
  if (!config.apiKey) {
    throw new Error("PostHog API key is required")
  }

  return new PostHog(config.apiKey, {
    host: config.host || "https://app.posthog.com",
    flushAt: 10, // Batch size for events
    flushInterval: 10000, // 10 seconds
  })
}

/**
 * Create a Layer that provides PostHog service
 *
 * Example usage:
 * ```ts
 * const PostHogLive = createPostHogLayer({
 *   apiKey: process.env.POSTHOG_API_KEY!,
 *   host: "http://localhost:8001",
 * })
 *
 * const program = Effect.gen(function* () {
 *   const posthog = yield* PostHogService
 *   yield* trackServerEvent(posthog, "user_signed_up", {
 *     userId: "123",
 *     email: "user@example.com",
 *   })
 * })
 *
 * Effect.runPromise(program.pipe(Effect.provide(PostHogLive)))
 * ```
 * @param config - The PostHog server configuration.
 * @returns A Layer that provides the PostHog service.
 */
export function createPostHogLayer(
  config: PostHogServerConfig,
): Layer.Layer<PostHogService> {
  return Layer.succeed(PostHogService, { client: createPostHogClient(config) })
}

/**
 * Track a server-side event using Effect
 *
 * Example usage:
 * ```ts
 * const program = Effect.gen(function* () {
 *   yield* trackServerEvent("user_login", {
 *     userId: "user-123",
 *     method: "password",
 *   })
 * })
 * ```
 * @param eventName - The name of the event to track.
 * @param properties - (Optional) Additional properties for the event.
 * @param properties.distinctId - The unique ID of the user associated with the event.
 * @returns An Effect that tracks the event.
 */
export function trackServerEvent(
  eventName: string,
  properties?: {
    distinctId?: string
    [key: string]: unknown
  },
): Effect.Effect<void, never, PostHogService> {
  return Effect.gen(function*() {
    const { client } = yield* PostHogService
    const distinctId = properties?.distinctId || "server"

    client.capture({
      distinctId,
      event: eventName,
      properties: {
        ...properties,
        $lib: "posthog-node",
      },
    })

    yield* Effect.log(`Tracked event: ${eventName}`, properties)
  })
}

/**
 * Identify a user on the server
 *
 * Example usage:
 * ```ts
 * const program = Effect.gen(function* () {
 *   yield* identifyServerUser("user-123", {
 *     email: "user@example.com",
 *     name: "John Doe",
 *     plan: "pro",
 *   })
 * })
 * ```
 * @param distinctId - The unique ID of the user.
 * @param properties - (Optional) Additional properties to identify the user with.
 * @returns An Effect that identifies the user.
 */
export function identifyServerUser(
  distinctId: string,
  properties?: Record<string, unknown>,
): Effect.Effect<void, never, PostHogService> {
  return Effect.gen(function*() {
    const { client } = yield* PostHogService

    client.identify(
      properties
        ? { distinctId, properties }
        : { distinctId },
    )

    yield* Effect.log(`Identified user: ${distinctId}`, properties)
  })
}

/**
 * Get a feature flag value for a user
 *
 * Example usage:
 * ```ts
 * const program = Effect.gen(function* () {
 *   const isEnabled = yield* getServerFeatureFlag(
 *     "new_feature",
 *     "user-123"
 *   )
 *
 *   if (isEnabled) {
 *     // Execute new feature logic
 *   }
 * })
 * ```
 * @param flagKey - The key of the feature flag.
 * @param distinctId - The unique ID of the user.
 * @param defaultValue - The default value if the flag is not found or not enabled.
 * @returns An Effect that returns the feature flag value.
 */
export function getServerFeatureFlag(
  flagKey: string,
  distinctId: string,
  defaultValue: boolean | string = false,
): Effect.Effect<boolean | string, never, PostHogService> {
  return Effect.gen(function*() {
    const { client } = yield* PostHogService

    const flagValue = yield* Effect.promise(() =>
      client.getFeatureFlag(flagKey, distinctId)
    )

    return flagValue ?? defaultValue
  })
}

/**
 * Check if a feature flag is enabled for a user
 *
 * Example usage:
 * ```ts
 * const program = Effect.gen(function* () {
 *   const canAccessBeta = yield* isServerFeatureFlagEnabled(
 *     "beta_access",
 *     "user-123"
 *   )
 *
 *   if (canAccessBeta) {
 *     yield* Effect.log("User has beta access")
 *   }
 * })
 * ```
 * @param flagKey - The key of the feature flag.
 * @param distinctId - The unique ID of the user.
 * @returns An Effect that returns true if the feature flag is enabled, false otherwise.
 */
export function isServerFeatureFlagEnabled(
  flagKey: string,
  distinctId: string,
): Effect.Effect<boolean, never, PostHogService> {
  return Effect.gen(function*() {
    const { client } = yield* PostHogService

    const isEnabled = yield* Effect.promise(() =>
      client.isFeatureEnabled(flagKey, distinctId)
    )

    return isEnabled ?? false
  })
}

/**
 * Flush all pending events (useful before shutdown)
 *
 * Example usage:
 * ```ts
 * const program = Effect.gen(function* () {
 *   yield* trackServerEvent("app_shutdown", {})
 *   yield* flushPostHog()
 * })
 * ```
 * @returns An Effect that flushes all pending events.
 */
export function flushPostHog(): Effect.Effect<void, never, PostHogService> {
  return Effect.gen(function*() {
    const { client } = yield* PostHogService

    yield* Effect.promise(() => client.flush())
    yield* Effect.log("PostHog events flushed")
  })
}

/**
 * Shutdown PostHog client (call this on application shutdown)
 *
 * Example usage:
 * ```ts
 * const program = Effect.gen(function* () {
 *   // ... your application logic
 *   yield* shutdownPostHog()
 * })
 * ```
 * @returns An Effect that shuts down the PostHog client.
 */
export function shutdownPostHog(): Effect.Effect<void, never, PostHogService> {
  return Effect.gen(function*() {
    const { client } = yield* PostHogService

    yield* Effect.promise(() => client.shutdown())
    yield* Effect.log("PostHog client shutdown")
  })
}
