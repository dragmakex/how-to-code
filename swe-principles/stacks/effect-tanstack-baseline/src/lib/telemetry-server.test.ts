import type { layer as nodeLayer } from "@effect/opentelemetry/NodeSdk"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  createCombinedTelemetryLayer,
  createOTLPTelemetryLayer,
  createSentryTelemetryLayer,
  initSentry,
} from "./telemetry-server"

/**
 * Tests for telemetry-server.ts - Server-side telemetry integration.
 *
 * We mock Sentry and OpenTelemetry to test the configuration functions.
 */

// Mock @sentry/node
vi.mock("@sentry/node", () => ({
  init: vi.fn(),
  httpIntegration: vi.fn().mockReturnValue({ name: "Http" }),
  nativeNodeFetchIntegration: vi.fn().mockReturnValue({
    name: "NativeNodeFetch",
  }),
}))

// Mock @sentry/opentelemetry
vi.mock("@sentry/opentelemetry", () => ({
  SentrySpanProcessor: vi.fn().mockImplementation(function() {
    return {
      onStart: vi.fn(),
      onEnd: vi.fn(),
      shutdown: vi.fn(),
      forceFlush: vi.fn(),
    }
  }),
}))

// Mock @opentelemetry/exporter-trace-otlp-http
vi.mock("@opentelemetry/exporter-trace-otlp-http", () => ({
  OTLPTraceExporter: vi.fn().mockImplementation(function() {
    return {
      export: vi.fn(),
      shutdown: vi.fn(),
    }
  }),
}))

// Mock @opentelemetry/sdk-trace-base
vi.mock("@opentelemetry/sdk-trace-base", () => ({
  BatchSpanProcessor: vi.fn().mockImplementation(function() {
    return {
      onStart: vi.fn(),
      onEnd: vi.fn(),
      shutdown: vi.fn(),
      forceFlush: vi.fn(),
    }
  }),
}))

// Mock @effect/opentelemetry/NodeSdk
vi.mock("@effect/opentelemetry/NodeSdk", () => ({
  layer: vi.fn().mockReturnValue({
    _tag: "Layer",
  }),
}))

type NodeSdkModule = {
  layer: typeof nodeLayer
}

const getLayerFactory = (NodeSdk: NodeSdkModule): () => unknown => {
  const layerFactory = (NodeSdk.layer as unknown as {
    mock: { calls: Array<[() => unknown]> }
  })
    .mock
    .calls
    .at(-1)
    ?.[0]
  if (typeof layerFactory !== "function") {
    throw new Error("Expected NodeSdk.layer to receive a factory function")
  }
  return layerFactory
}

const getLayerOptions = (NodeSdk: NodeSdkModule): unknown =>
  getLayerFactory(NodeSdk)()

describe("telemetry-server", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("initSentry", () => {
    it("initializes Sentry with valid DSN", async () => {
      const Sentry = await import("@sentry/node")

      initSentry({
        serviceName: "test-service",
        sentryDsn: "https://test@sentry.io/123",
        environment: "test",
      })

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: "https://test@sentry.io/123",
          environment: "test",
          tracesSampleRate: 1.0,
        }),
      )
    })

    it("uses default environment when not provided", async () => {
      const Sentry = await import("@sentry/node")

      initSentry({
        serviceName: "test-service",
        sentryDsn: "https://test@sentry.io/123",
      })

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: "development",
        }),
      )
    })

    it("skips initialization when DSN is missing", async () => {
      const Sentry = await import("@sentry/node")
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      initSentry({
        serviceName: "test-service",
      })

      expect(Sentry.init).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        "Sentry DSN not provided, skipping Sentry initialization",
      )
      consoleSpy.mockRestore()
    })

    it("includes HTTP and NodeFetch integrations", async () => {
      const Sentry = await import("@sentry/node")

      initSentry({
        serviceName: "test-service",
        sentryDsn: "https://test@sentry.io/123",
      })

      expect(Sentry.httpIntegration).toHaveBeenCalled()
      expect(Sentry.nativeNodeFetchIntegration).toHaveBeenCalled()
    })
  })

  describe("createSentryTelemetryLayer", () => {
    it("creates a layer with Sentry span processor", async () => {
      const NodeSdk = await import("@effect/opentelemetry/NodeSdk")

      const layer = createSentryTelemetryLayer({
        serviceName: "test-service",
        environment: "test",
      })

      expect(layer).toBeDefined()
      expect(NodeSdk.layer).toHaveBeenCalled()
      const options = getLayerOptions(NodeSdk)
      expect(options).toMatchObject({
        resource: {
          serviceName: "test-service",
          environment: "test",
        },
      })
    })

    it("uses default environment", async () => {
      const NodeSdk = await import("@effect/opentelemetry/NodeSdk")
      const layer = createSentryTelemetryLayer({
        serviceName: "test-service",
      })

      expect(layer).toBeDefined()
      expect(NodeSdk.layer).toHaveBeenCalled()
      const options = getLayerOptions(NodeSdk)
      expect(options).toMatchObject({
        resource: {
          serviceName: "test-service",
          environment: "development",
        },
      })
    })
  })

  describe("createOTLPTelemetryLayer", () => {
    it("creates a layer with OTLP exporter", async () => {
      const NodeSdk = await import("@effect/opentelemetry/NodeSdk")

      const layer = createOTLPTelemetryLayer({
        serviceName: "test-service",
        otlpEndpoint: "http://localhost:4318/v1/traces",
      })

      expect(layer).toBeDefined()
      expect(NodeSdk.layer).toHaveBeenCalled()
      const options = getLayerOptions(NodeSdk)
      expect(options).toMatchObject({
        resource: {
          serviceName: "test-service",
          environment: "development",
        },
      })
    })

    it("uses default OTLP endpoint when not provided", async () => {
      const layer = createOTLPTelemetryLayer({
        serviceName: "test-service",
      })

      expect(layer).toBeDefined()
    })
  })

  describe("createCombinedTelemetryLayer", () => {
    it("creates a combined layer", async () => {
      const NodeSdk = await import("@effect/opentelemetry/NodeSdk")

      const layer = createCombinedTelemetryLayer({
        serviceName: "test-service",
        otlpEndpoint: "http://localhost:4318/v1/traces",
      })

      expect(layer).toBeDefined()
      expect(NodeSdk.layer).toHaveBeenCalled()
      const options = getLayerOptions(NodeSdk)
      expect(options).toMatchObject({
        resource: {
          serviceName: "test-service",
          environment: "development",
        },
      })
    })

    it("uses default OTLP endpoint in combined layer", async () => {
      const layer = createCombinedTelemetryLayer({
        serviceName: "test-service",
      })

      expect(layer).toBeDefined()
    })
  })
})
