/**
 * Unified server observability — traces, logs, metrics via OTLP.
 *
 * Provides a single `ObservabilityLive` layer that replaces Effect's
 * default tracer and logger with OpenTelemetry-backed implementations.
 * Traces flow to Tempo (via OTLP), logs flow to Loki (via OTLP).
 *
 * All configuration is sourced through `effect/Config` — no direct
 * `process.env` access.
 *
 * @see https://github.com/dtechvision/laos — LAOS stack
 * @see docs/APP-WIRING.md — wiring guide
 */

import * as NodeSdk from "@effect/opentelemetry/NodeSdk"
import type * as Resource from "@effect/opentelemetry/Resource"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import type * as Layer from "effect/Layer"

const OTLP_TRACES_PATH = "/v1/traces"
const OTLP_LOGS_PATH = "/v1/logs"
const OTLP_LOG_EXPORT_DELAY_MILLIS = 1000

export const toOtlpSignalUrl = (
  endpoint: string,
  signalPath: typeof OTLP_TRACES_PATH | typeof OTLP_LOGS_PATH,
): string => {
  const normalizedEndpoint = endpoint.trim().replace(/\/+$/, "")
  return normalizedEndpoint.endsWith(signalPath)
    ? normalizedEndpoint
    : `${normalizedEndpoint}${signalPath}`
}

/**
 * Full OTLP observability layer — traces (Tempo) + logs (Loki) + resource.
 *
 * Configuration:
 * - `OTLP_ENDPOINT` — Tempo OTLP base URL (default: http://localhost:4318)
 * - `LOKI_OTLP_ENDPOINT` — Loki OTLP log endpoint (default: http://localhost:3100/otlp)
 * - `SERVICE_NAME` — service identity in traces and logs
 * - `NODE_ENV` — deployment environment attribute
 *
 * All `Effect.log` calls become OTLP log records sent to Loki.
 * All `Effect.withSpan` calls become OTLP spans sent to Tempo.
 */
export const ObservabilityLive: Layer.Layer<
  Resource.Resource,
  Config.ConfigError
> = NodeSdk.layer(
  Effect.gen(function*() {
    const traceEndpoint = yield* Config.string("OTLP_ENDPOINT").pipe(
      Config.orElse(() => Config.succeed("http://localhost:4318")),
    )
    const lokiOtlpEndpoint = yield* Config.string("LOKI_OTLP_ENDPOINT").pipe(
      Config.orElse(() => Config.succeed("http://localhost:3100/otlp")),
    )
    const serviceName = yield* Config.string("SERVICE_NAME").pipe(
      Config.orElse(() => Config.succeed("effect-tanstack-start")),
    )
    const environment = yield* Config.string("NODE_ENV").pipe(
      Config.orElse(() => Config.succeed("development")),
    )

    const version = process.env.npm_package_version ?? "0.0.0"

    return {
      resource: {
        serviceName,
        serviceVersion: version,
        attributes: {
          "deployment.environment": environment,
        },
      },
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: toOtlpSignalUrl(traceEndpoint, OTLP_TRACES_PATH),
        }),
      ),
      logRecordProcessor: new BatchLogRecordProcessor(
        new OTLPLogExporter({
          url: toOtlpSignalUrl(lokiOtlpEndpoint, OTLP_LOGS_PATH),
        }),
        {
          scheduledDelayMillis: OTLP_LOG_EXPORT_DELAY_MILLIS,
        },
      ),
    }
  }),
)
