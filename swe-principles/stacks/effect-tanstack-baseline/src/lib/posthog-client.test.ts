/* eslint-disable camelcase */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  getFeatureFlag,
  identifyUser,
  initPostHog,
  isFeatureFlagEnabled,
  onFeatureFlags,
  posthog,
  resetPostHog,
  setUserProperties,
  startSessionRecording,
  stopSessionRecording,
  trackEvent,
  trackPageView,
} from "./posthog-client"

/**
 * Tests for posthog-client.ts - Client-side PostHog integration.
 *
 * We mock the posthog-js library to test the wrapper functions.
 * Tests run in browser environment where window is already defined.
 */

// Mock posthog-js
vi.mock("posthog-js", () => ({
  default: {
    init: vi.fn(),
    identify: vi.fn(),
    capture: vi.fn(),
    reset: vi.fn(),
    getFeatureFlag: vi.fn().mockReturnValue(true),
    isFeatureEnabled: vi.fn().mockReturnValue(true),
    onFeatureFlags: vi.fn(),
    people: {
      set: vi.fn(),
    },
    startSessionRecording: vi.fn(),
    stopSessionRecording: vi.fn(),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal("window", {
    location: {
      href: "http://localhost:3000/current",
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe("initPostHog", () => {
  it("initializes PostHog with config", () => {
    initPostHog({
      apiKey: "test-key",
      apiHost: "http://localhost:8000",
    })

    expect(posthog.init).toHaveBeenCalledWith(
      "test-key",
      expect.objectContaining({
        api_host: "http://localhost:8000",
      }),
    )
  })

  it("uses default host when not provided", () => {
    initPostHog({
      apiKey: "test-key",
    })

    expect(posthog.init).toHaveBeenCalledWith(
      "test-key",
      expect.objectContaining({
        api_host: "https://app.posthog.com",
      }),
    )
  })

  it("disables session recording when configured", () => {
    initPostHog({
      apiKey: "test-key",
      enableSessionRecording: false,
    })

    expect(posthog.init).toHaveBeenCalledWith(
      "test-key",
      expect.objectContaining({
        disable_session_recording: true,
      }),
    )
  })

  it("disables autocapture when configured", () => {
    initPostHog({
      apiKey: "test-key",
      enableAutocapture: false,
    })

    expect(posthog.init).toHaveBeenCalledWith(
      "test-key",
      expect.objectContaining({
        autocapture: false,
      }),
    )
  })

  it("disables performance capture when configured", () => {
    initPostHog({
      apiKey: "test-key",
      enablePerformanceCapture: false,
    })

    expect(posthog.init).toHaveBeenCalledWith(
      "test-key",
      expect.objectContaining({
        capture_performance: false,
      }),
    )
  })

  it("skips initialization when API key is missing", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    initPostHog({
      apiKey: "",
    })

    expect(posthog.init).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith(
      "PostHog API key not provided, skipping initialization",
    )
    consoleSpy.mockRestore()
  })

  it("enables debug mode when configured", () => {
    initPostHog({
      apiKey: "test-key",
      debugMode: true,
    })

    expect(posthog.init).toHaveBeenCalledWith(
      "test-key",
      expect.objectContaining({
        loaded: expect.any(Function),
      }),
    )
  })

  it("calls debug in loaded callback when debugMode is true", () => {
    const mockDebug = vi.fn()
    initPostHog({
      apiKey: "test-key",
      debugMode: true,
    })

    const initCall = vi.mocked(posthog.init).mock.calls[0]
    const options = initCall[1] as {
      loaded: (ph: { debug: () => void }) => void
    }
    options.loaded({ debug: mockDebug })

    expect(mockDebug).toHaveBeenCalled()
  })

  it("does not call debug when debugMode is false", () => {
    const mockDebug = vi.fn()
    initPostHog({
      apiKey: "test-key",
      debugMode: false,
    })

    const initCall = vi.mocked(posthog.init).mock.calls[0]
    const options = initCall[1] as {
      loaded: (ph: { debug: () => void }) => void
    }
    options.loaded({ debug: mockDebug })

    expect(mockDebug).not.toHaveBeenCalled()
  })
})

describe("identifyUser", () => {
  it("identifies a user with properties", () => {
    identifyUser({
      userId: "user-123",
      email: "test@example.com",
      name: "Test User",
    })

    expect(posthog.identify).toHaveBeenCalledWith("user-123", {
      email: "test@example.com",
      name: "Test User",
    })
  })

  it("identifies a user with only userId", () => {
    identifyUser({
      userId: "user-123",
    })

    expect(posthog.identify).toHaveBeenCalledWith("user-123", {})
  })
})

describe("trackEvent", () => {
  it("tracks an event with properties", () => {
    trackEvent("button_clicked", {
      button_id: "signup",
      page: "/landing",
    })

    expect(posthog.capture).toHaveBeenCalledWith("button_clicked", {
      button_id: "signup",
      page: "/landing",
    })
  })

  it("tracks an event without properties", () => {
    trackEvent("page_loaded")

    expect(posthog.capture).toHaveBeenCalledWith("page_loaded", undefined)
  })
})

describe("trackPageView", () => {
  it("tracks a page view with custom path", () => {
    trackPageView("/dashboard")

    expect(posthog.capture).toHaveBeenCalledWith("$pageview", {
      $current_url: "/dashboard",
    })
  })

  it("tracks a page view with current URL", () => {
    trackPageView()

    expect(posthog.capture).toHaveBeenCalledWith("$pageview", {
      $current_url: expect.any(String),
    })
  })
})

describe("resetPostHog", () => {
  it("resets PostHog state", () => {
    resetPostHog()

    expect(posthog.reset).toHaveBeenCalled()
  })
})

describe("getFeatureFlag", () => {
  it("returns feature flag value", () => {
    const value = getFeatureFlag("test-flag")

    expect(value).toBe(true)
    expect(posthog.getFeatureFlag).toHaveBeenCalledWith("test-flag")
  })
})

describe("isFeatureFlagEnabled", () => {
  it("returns true when flag is enabled", () => {
    const isEnabled = isFeatureFlagEnabled("test-flag")

    expect(isEnabled).toBe(true)
    expect(posthog.isFeatureEnabled).toHaveBeenCalledWith("test-flag")
  })

  it("returns false when flag is null", () => {
    vi.mocked(posthog.isFeatureEnabled).mockReturnValueOnce(
      null as unknown as boolean,
    )

    const isEnabled = isFeatureFlagEnabled("test-flag")

    expect(isEnabled).toBe(false)
  })
})

describe("onFeatureFlags", () => {
  it("registers a callback for feature flags", () => {
    const callback = vi.fn()
    onFeatureFlags(callback)

    expect(posthog.onFeatureFlags).toHaveBeenCalledWith(callback)
  })
})

describe("setUserProperties", () => {
  it("sets user properties", () => {
    setUserProperties({
      plan: "premium",
      beta_tester: true,
    })

    expect(posthog.people.set).toHaveBeenCalledWith({
      plan: "premium",
      beta_tester: true,
    })
  })
})

describe("startSessionRecording", () => {
  it("starts session recording", () => {
    startSessionRecording()

    expect(posthog.startSessionRecording).toHaveBeenCalled()
  })
})

describe("stopSessionRecording", () => {
  it("stops session recording", () => {
    stopSessionRecording()

    expect(posthog.stopSessionRecording).toHaveBeenCalled()
  })
})

describe("posthog export", () => {
  it("exports the posthog instance", () => {
    expect(posthog).toBeDefined()
  })
})
