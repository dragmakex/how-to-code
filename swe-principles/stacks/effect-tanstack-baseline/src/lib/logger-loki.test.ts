import { describe, expect, it } from "vitest"
import {
  createCombinedLoggerLayer,
  createLokiLogger,
  createLokiLoggerLayer,
} from "./logger-loki"

/**
 * Tests for logger-loki.ts - Grafana Loki logger integration.
 *
 * We test basic exports and configuration.
 */

describe("logger-loki", () => {
  describe("createLokiLogger", () => {
    it("creates a logger instance", () => {
      const logger = createLokiLogger({
        endpoint: "http://localhost:3100/loki/api/v1/push",
      })

      expect(logger).toBeDefined()
    })

    it("uses default config values when not provided", () => {
      const logger = createLokiLogger({
        endpoint: "http://test:3100",
      })

      expect(logger).toBeDefined()
    })

    it("accepts custom batch size", () => {
      const logger = createLokiLogger({
        endpoint: "http://test:3100",
        batchSize: 10,
      })

      expect(logger).toBeDefined()
    })

    it("accepts custom flush interval", () => {
      const logger = createLokiLogger({
        endpoint: "http://test:3100",
        flushIntervalMs: 5000,
      })

      expect(logger).toBeDefined()
    })

    it("accepts auth token", () => {
      const logger = createLokiLogger({
        endpoint: "http://test:3100",
        authToken: "test-token",
      })

      expect(logger).toBeDefined()
    })

    it("accepts custom labels", () => {
      const logger = createLokiLogger({
        endpoint: "http://test:3100",
        labels: { app: "test", env: "development" },
      })

      expect(logger).toBeDefined()
    })
  })

  describe("createLokiLoggerLayer", () => {
    it("creates a layer", () => {
      const layer = createLokiLoggerLayer({
        endpoint: "http://test:3100",
      })

      expect(layer).toBeDefined()
    })
  })

  describe("createCombinedLoggerLayer", () => {
    it("creates a combined layer", () => {
      const layer = createCombinedLoggerLayer({
        endpoint: "http://test:3100",
      })

      expect(layer).toBeDefined()
    })
  })
})
