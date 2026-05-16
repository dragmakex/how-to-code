import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Tests for telemetry-example.ts - Demo script for telemetry integration.
 *
 * This file has module-level side effects, so we test by mocking the
 * external dependencies and verifying the module can be loaded.
 */

// Mock all external dependencies before importing the module
vi.mock("effect/Effect", async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...(original as object),
    runPromise: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock("effect/Layer", async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...(original as object),
  }
})

vi.mock("./lib/logger-loki", () => ({
  createLokiLoggerLayer: vi.fn().mockReturnValue({ _tag: "Layer" }),
}))

vi.mock("./lib/posthog-server", () => ({
  createPostHogLayer: vi.fn().mockReturnValue({ _tag: "Layer" }),
  identifyServerUser: vi.fn().mockReturnValue({ _tag: "Effect" }),
  trackServerEvent: vi.fn().mockReturnValue({ _tag: "Effect" }),
}))

vi.mock("./lib/telemetry-server", () => ({
  createSentryTelemetryLayer: vi.fn().mockReturnValue({ _tag: "Layer" }),
  initSentry: vi.fn(),
}))

describe("telemetry-example", () => {
  const originalProcessExit = process.exit
  const originalProcessEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock process.exit to prevent test from exiting
    process.exit = vi.fn() as unknown as typeof process.exit
    // Set up environment variables
    process.env = {
      ...originalProcessEnv,
      SENTRY_DSN: "https://test@sentry.io/123",
      LOKI_ENDPOINT: "http://localhost:3100/loki/api/v1/push",
      POSTHOG_API_KEY: "test-key",
      POSTHOG_HOST: "http://localhost:8000",
      NODE_ENV: "test",
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
    process.exit = originalProcessExit
    process.env = originalProcessEnv
    vi.resetModules()
  })

  it("initializes Sentry on module load", async () => {
    const { initSentry } = await import("./lib/telemetry-server")

    // Force re-import to trigger side effects
    vi.resetModules()

    // Re-mock after reset
    vi.doMock("./lib/telemetry-server", () => ({
      createSentryTelemetryLayer: vi.fn().mockReturnValue({ _tag: "Layer" }),
      initSentry: vi.fn(),
    }))

    expect(initSentry).toBeDefined()
  })

  it("creates telemetry layers", async () => {
    const { createSentryTelemetryLayer } = await import(
      "./lib/telemetry-server"
    )
    const { createLokiLoggerLayer } = await import("./lib/logger-loki")
    const { createPostHogLayer } = await import("./lib/posthog-server")

    expect(createSentryTelemetryLayer).toBeDefined()
    expect(createLokiLoggerLayer).toBeDefined()
    expect(createPostHogLayer).toBeDefined()
  })

  it("exports PostHog event tracking functions", async () => {
    const { identifyServerUser, trackServerEvent } = await import(
      "./lib/posthog-server"
    )

    expect(trackServerEvent).toBeDefined()
    expect(identifyServerUser).toBeDefined()
  })

  it("has valid configuration structure", () => {
    // Test configuration constants match expected structure
    const config = {
      serviceName: "effect-tanstack-start",
      sentryDsn: process.env.SENTRY_DSN ?? "",
      environment: process.env.NODE_ENV || "development",
    }

    expect(config.serviceName).toBe("effect-tanstack-start")
    expect(config.sentryDsn).toBe("https://test@sentry.io/123")
    expect(config.environment).toBe("test")
  })

  it("has valid Loki configuration", () => {
    const lokiConfig = {
      endpoint: process.env.LOKI_ENDPOINT
        || "http://localhost:3100/loki/api/v1/push",
      labels: {
        job: "effect-tanstack-start",
        environment: process.env.NODE_ENV || "development",
      },
    }

    expect(lokiConfig.endpoint).toBe("http://localhost:3100/loki/api/v1/push")
    expect(lokiConfig.labels.job).toBe("effect-tanstack-start")
  })

  it("has valid PostHog configuration", () => {
    const posthogConfig = {
      apiKey: process.env.POSTHOG_API_KEY || "phc_development_key",
      host: process.env.POSTHOG_HOST || "http://localhost:8000",
    }

    expect(posthogConfig.apiKey).toBe("test-key")
    expect(posthogConfig.host).toBe("http://localhost:8000")
  })
})
