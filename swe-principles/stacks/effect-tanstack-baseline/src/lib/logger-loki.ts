import * as Logger from "effect/Logger"
import type * as LogLevel from "effect/LogLevel"

interface LokiConfig {
  endpoint: string
  labels?: Record<string, string>
  batchSize?: number
  flushIntervalMs?: number
  authToken?: string
}

interface LokiLogEntry {
  ts: string
  line: string
}

interface LokiStream {
  stream: Record<string, string>
  values: Array<[string, string]>
}

interface LokiPushRequest {
  streams: Array<LokiStream>
}

/**
 * Internal log buffer for batching
 */
class LogBuffer {
  private buffer: Array<
    { timestamp: number; message: string; level: LogLevel.LogLevel }
  > = []
  private timer: NodeJS.Timeout | null = null

  /**
   * Constructs a new LogBuffer.
   * @param config - The Loki configuration.
   * @param flush - The function to call when logs need to be flushed.
   */
  constructor(
    private config: Required<LokiConfig>,
    private flush: (
      logs: Array<
        { timestamp: number; message: string; level: LogLevel.LogLevel }
      >,
    ) => void,
  ) {}

  /**
   * Adds a log entry to the buffer.
   * @param timestamp - The timestamp of the log entry.
   * @param message - The log message.
   * @param level - The log level.
   */
  add(timestamp: number, message: string, level: LogLevel.LogLevel) {
    this.buffer.push({ timestamp, message, level })

    if (this.buffer.length >= this.config.batchSize) {
      this.flushNow()
    } else if (!this.timer) {
      this.timer = setTimeout(
        () => this.flushNow(),
        this.config.flushIntervalMs,
      )
    }
  }

  /**
   * Flushes the current buffer immediately.
   */
  private flushNow() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    if (this.buffer.length > 0) {
      const logsToFlush = this.buffer.splice(0, this.buffer.length)
      this.flush(logsToFlush)
    }
  }

  /**
   * Destroys the buffer, flushing any remaining logs.
   */
  destroy() {
    this.flushNow()
  }
}

/**
 * Create a Logger that sends logs to Grafana Loki
 * @param config - The Loki configuration.
 * @returns A custom Effect logger.
 */
export function createLokiLogger(
  config: LokiConfig,
): Logger.Logger<unknown, void> {
  const fullConfig: Required<LokiConfig> = {
    endpoint: config.endpoint,
    labels: config.labels || { job: "effect-app", level: "application" },
    batchSize: config.batchSize || 100,
    flushIntervalMs: config.flushIntervalMs || 5000,
    authToken: config.authToken || "",
  }

  // Function to send logs to Loki
  const sendToLoki = async (
    logs: Array<
      { timestamp: number; message: string; level: LogLevel.LogLevel }
    >,
  ) => {
    try {
      const streams: Record<string, Array<LokiLogEntry>> = {}

      // Group logs by level
      for (const log of logs) {
        const levelKey = log.level
        if (!streams[levelKey]) {
          streams[levelKey] = []
        }

        // Loki expects timestamp in nanoseconds as a string
        const timestampNs = `${log.timestamp * 1_000_000}`

        streams[levelKey].push({
          ts: timestampNs,
          line: log.message,
        })
      }

      // Convert to Loki format
      const lokiStreams: Array<LokiStream> = Object.entries(streams).map((
        [level, entries],
      ) => ({
        stream: {
          ...fullConfig.labels,
          level,
        },
        values: entries.map((entry) => [entry.ts, entry.line]),
      }))

      const body: LokiPushRequest = {
        streams: lokiStreams,
      }

      // Send to Loki
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (fullConfig.authToken) {
        headers.Authorization = `Bearer ${fullConfig.authToken}`
      }

      const response = await fetch(fullConfig.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        console.error(
          `Failed to send logs to Loki: ${response.status} ${response.statusText}`,
        )
      }
    } catch (error) {
      console.error("Error sending logs to Loki:", error)
    }
  }

  // Create a buffer for batching logs
  const buffer = new LogBuffer(fullConfig, sendToLoki)

  // Create the custom logger
  return Logger.make(({ date, logLevel, message }) => {
    const timestamp = date.getTime()

    // Format the message
    let formattedMessage: string
    if (typeof message === "string") {
      formattedMessage = message
    } else if (Array.isArray(message)) {
      formattedMessage = message.map((m) => String(m)).join(" ")
    } else {
      formattedMessage = JSON.stringify(message)
    }

    // Add to buffer
    buffer.add(timestamp, formattedMessage, logLevel)
  })
}

/**
 * Create a layer that replaces the default logger with a Loki logger
 *
 * Example usage:
 *
 * ```ts
 * import { Effect } from "effect"
 * import { createLokiLoggerLayer } from "./lib/logger-loki"
 *
 * const LokiLoggerLive = createLokiLoggerLayer({
 *   endpoint: "http://localhost:3100/loki/api/v1/push",
 *   labels: {
 *     job: "my-app",
 *     environment: "production",
 *   },
 * })
 *
 * const program = Effect.gen(function* () {
 *   yield* Effect.log("Hello from Loki!")
 * })
 *
 * Effect.runPromise(program.pipe(Effect.provide(LokiLoggerLive)))
 * ```
 * @param config - The Loki configuration.
 * @returns A Layer that provides the Loki logger.
 */
export function createLokiLoggerLayer(config: LokiConfig) {
  const lokiLogger = createLokiLogger(config)
  return Logger.layer([lokiLogger])
}

/**
 * Create a combined logger that logs to both console and Loki
 *
 * This is useful during development when you want to see logs in the console
 * while also sending them to Loki for aggregation and analysis.
 *
 * Example usage:
 *
 * ```ts
 * import { Effect } from "effect"
 * import { createCombinedLoggerLayer } from "./lib/logger-loki"
 *
 * const LoggerLive = createCombinedLoggerLayer({
 *   endpoint: "http://localhost:3100/loki/api/v1/push",
 *   labels: { job: "my-app" },
 * })
 *
 * const program = Effect.gen(function* () {
 *   yield* Effect.log("This goes to both console and Loki!")
 * })
 *
 * Effect.runPromise(program.pipe(Effect.provide(LoggerLive)))
 * ```
 * @param config - The Loki configuration.
 * @returns A Layer that provides the combined console and Loki logger.
 */
export function createCombinedLoggerLayer(config: LokiConfig) {
  const lokiLogger = createLokiLogger(config)
  return Logger.layer([Logger.defaultLogger, lokiLogger])
}
