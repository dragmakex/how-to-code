import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  captureException,
  captureMessage,
  initClientSentry,
  SentryErrorBoundary,
  setUser,
  startSpan,
  withSentryProfiler,
} from "./telemetry-client"

/**
 * Tests for telemetry-client.ts - Client-side telemetry integration.
 *
 * We mock @sentry/react to test the wrapper functions.
 */

// Mock @sentry/react
vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn().mockReturnValue({
    name: "BrowserTracing",
  }),
  replayIntegration: vi.fn().mockReturnValue({ name: "Replay" }),
  ErrorBoundary: vi.fn().mockImplementation(({ children }) => children),
  withProfiler: vi.fn().mockImplementation((component) => component),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  startSpan: vi.fn().mockImplementation((_opts, callback) => callback()),
}))

const TestComponent = () => null

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("initClientSentry", () => {
  it("initializes Sentry with valid DSN", async () => {
    const Sentry = await import("@sentry/react")

    initClientSentry({
      sentryDsn: "https://test@sentry.io/123",
      environment: "test",
    })

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://test@sentry.io/123",
        environment: "test",
      }),
    )
  })

  it("uses default environment when not provided", async () => {
    const Sentry = await import("@sentry/react")

    initClientSentry({
      sentryDsn: "https://test@sentry.io/123",
    })

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: "development",
      }),
    )
  })

  it("uses default traces sample rate when not provided", async () => {
    const Sentry = await import("@sentry/react")

    initClientSentry({
      sentryDsn: "https://test@sentry.io/123",
    })

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        tracesSampleRate: 1.0,
      }),
    )
  })

  it("uses custom traces sample rate", async () => {
    const Sentry = await import("@sentry/react")

    initClientSentry({
      sentryDsn: "https://test@sentry.io/123",
      tracesSampleRate: 0.5,
    })

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        tracesSampleRate: 0.5,
      }),
    )
  })

  it("uses default replay sample rates", async () => {
    const Sentry = await import("@sentry/react")

    initClientSentry({
      sentryDsn: "https://test@sentry.io/123",
    })

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      }),
    )
  })

  it("uses custom replay sample rates", async () => {
    const Sentry = await import("@sentry/react")

    initClientSentry({
      sentryDsn: "https://test@sentry.io/123",
      replaysSessionSampleRate: 0.5,
      replaysOnErrorSampleRate: 0.8,
    })

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        replaysSessionSampleRate: 0.5,
        replaysOnErrorSampleRate: 0.8,
      }),
    )
  })

  it("skips initialization when DSN is missing", async () => {
    const Sentry = await import("@sentry/react")
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    initClientSentry({})

    expect(Sentry.init).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith(
      "Sentry DSN not provided, skipping Sentry initialization",
    )
    consoleSpy.mockRestore()
  })

  it("includes browser tracing integration", async () => {
    const Sentry = await import("@sentry/react")

    initClientSentry({
      sentryDsn: "https://test@sentry.io/123",
    })

    expect(Sentry.browserTracingIntegration).toHaveBeenCalled()
  })

  it("includes replay integration", async () => {
    const Sentry = await import("@sentry/react")

    initClientSentry({
      sentryDsn: "https://test@sentry.io/123",
    })

    expect(Sentry.replayIntegration).toHaveBeenCalledWith({
      maskAllText: false,
      blockAllMedia: false,
    })
  })
})

describe("SentryErrorBoundary", () => {
  it("is exported from Sentry", () => {
    expect(SentryErrorBoundary).toBeDefined()
  })
})

describe("withSentryProfiler", () => {
  it("is exported from Sentry", () => {
    expect(withSentryProfiler).toBeDefined()
  })

  it("wraps a component", () => {
    const wrapped = withSentryProfiler(TestComponent)
    expect(wrapped).toBe(TestComponent) // Mock returns the same component
  })
})

describe("captureException", () => {
  it("is exported from Sentry", () => {
    expect(captureException).toBeDefined()
  })

  it("captures an exception", () => {
    const error = new Error("Test error")
    captureException(error)
    expect(captureException).toHaveBeenCalledWith(error)
  })
})

describe("captureMessage", () => {
  it("is exported from Sentry", () => {
    expect(captureMessage).toBeDefined()
  })

  it("captures a message", () => {
    captureMessage("Test message")
    expect(captureMessage).toHaveBeenCalledWith("Test message")
  })
})

describe("setUser", () => {
  it("is exported from Sentry", () => {
    expect(setUser).toBeDefined()
  })

  it("sets user context", () => {
    setUser({
      id: "user-123",
      email: "test@example.com",
    })
    expect(setUser).toHaveBeenCalledWith({
      id: "user-123",
      email: "test@example.com",
    })
  })
})

describe("startSpan", () => {
  it("is exported from Sentry", () => {
    expect(startSpan).toBeDefined()
  })

  it("starts a span and executes callback", async () => {
    const callback = vi.fn().mockReturnValue("result")
    const result = await startSpan({ name: "test-span" }, callback)

    expect(callback).toHaveBeenCalled()
    expect(result).toBe("result")
  })
})
