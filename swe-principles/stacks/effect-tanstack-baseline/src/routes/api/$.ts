/**
 * Pattern: Layer Composition + ManagedRuntime + Middleware
 * Purpose: Effect runtime integration for TanStack Start with HMR-safe disposal,
 * Layer memoization, signal handling, and RPC middleware
 * See: docs/architecture/effect-simple-made-easy-mapping.md
 */

import { DomainApi } from "@/api/domain-api"
import { DomainRpc } from "@/api/domain-rpc"
import { TodosApplicationLive } from "@/features/todos/application"
import { ObservabilityLive } from "@/lib/observability"
import {
  initPyroscopeServer,
  shutdownPyroscopeServer,
} from "@/lib/pyroscope-server"
import { SentryLive } from "@/lib/sentry-effect"
import { handleSentryTestPost } from "@/lib/sentry-service"
import { initServer } from "@/lib/server-init"
import { createFileRoute } from "@tanstack/react-router"
import type { Cause } from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Layer from "effect/Layer"
import * as Logger from "effect/Logger"
import * as ManagedRuntime from "effect/ManagedRuntime"
import * as HttpRouter from "effect/unstable/http/HttpRouter"
import * as HttpServer from "effect/unstable/http/HttpServer"
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse"
import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder"
import * as RpcMiddleware from "effect/unstable/rpc/RpcMiddleware"
import * as RpcSerialization from "effect/unstable/rpc/RpcSerialization"
import * as RpcServer from "effect/unstable/rpc/RpcServer"
import { TodosApiLive } from "./-lib/todos-api-live"
import { TodosRpcLive } from "./-lib/todos-rpc-live"

/**
 * RPC logging middleware - logs errors for failed RPC requests.
 * Exported for testing.
 */
export class RpcLogger
  extends RpcMiddleware.Service<RpcLogger>()("RpcLogger")
{}

type RpcMiddlewareOptions = Parameters<RpcMiddleware.Any>[1]

/**
 * RPC logger handler implementation.
 * Exported for testing.
 *
 * @param opts - The options for the RPC logger handler.
 * @param opts.effect - The effect to execute.
 * @param opts.rpc - The RPC request metadata.
 * @param opts.rpc._tag - The RPC method tag.
 * @param opts.client - The client metadata.
 * @param opts.client.id - The client identifier.
 * @returns An Effect that yields the Exit result after logging any errors.
 */
export const createRpcLoggerHandler = <A, E>(
  opts: {
    effect: Effect.Effect<A, E>
    rpc: { readonly _tag: string }
    client: { readonly id: string }
  },
): Effect.Effect<Exit.Exit<A, E>, never, never> => {
  const exited = Effect.exit(opts.effect)

  return Effect.flatMap(exited, (exit) =>
    Exit.match(exit, {
      onSuccess: () => Effect.succeed(exit),
      onFailure: (cause: Cause<E>) =>
        Effect.logError(`RPC request failed: ${opts.rpc._tag}`, cause).pipe(
          Effect.annotateLogs({
            "rpc.method": opts.rpc._tag,
            "rpc.clientId": opts.client.id,
          }),
          Effect.map(() => exit),
        ),
    }))
}

/**
 * RPC logger middleware handler that wraps the next effect with logging.
 * Returns the original result or re-raises the error after logging.
 *
 * @param effect - The effect to execute.
 * @param opts - The options for the RPC logger middleware.
 * @param opts.rpc - The RPC request metadata.
 * @param opts.rpc._tag - The RPC method tag.
 * @param opts.client - The client metadata.
 * @param opts.client.id - The client identifier.
 * @returns An Effect that yields the result or fails with the original error.
 */
const rpcLoggerMiddleware = <A, E>(
  effect: Effect.Effect<A, E>,
  opts: RpcMiddlewareOptions,
): Effect.Effect<A, E, never> => {
  const exited = Effect.exit(effect)

  return Effect.flatMap(exited, (exit) =>
    Exit.match(exit, {
      onSuccess: (value) => Effect.succeed(value),
      onFailure: (cause: Cause<E>) =>
        Effect.logError(`RPC request failed: ${opts.rpc._tag}`, cause).pipe(
          Effect.annotateLogs({
            "rpc.method": opts.rpc._tag,
            "rpc.clientId": opts.client.id,
          }),
          Effect.flatMap(() => Effect.failCause(cause)),
        ),
    }))
}

export const RpcLoggerLive = Layer.succeed(
  RpcLogger,
  RpcLogger.of(rpcLoggerMiddleware),
)

/**
 * Router layers - exported for testing.
 */
export const RpcRouter = RpcServer
  .layer(DomainRpc.middleware(RpcLogger), {
    spanPrefix: "rpc",
    disableFatalDefects: true,
  })
  .pipe(
    Layer.provide(TodosRpcLive),
    Layer.provide(RpcLoggerLive),
    Layer.provide(
      RpcServer.layerProtocolHttp({ path: "/api/rpc" }).pipe(
        Layer.provide(RpcSerialization.layerNdjson),
      ),
    ),
  )

export const HttpApiRouter = HttpApiBuilder.layer(DomainApi).pipe(
  Layer.provide(TodosApiLive),
  Layer.provide(HttpServer.layerServices),
)

export const HealthRoute = HttpRouter.add(
  "GET",
  "/api/health",
  Effect.succeed(HttpServerResponse.text("OK")),
)

/**
 * Sentry integration test routes.
 *
 * GET /api/sentry-test — Status check
 * POST /api/sentry-test — Trigger test error (captured by Sentry)
 *
 * Verification: Check http://localhost:9000 after POST for captured error.
 */
const SentryTestGet = HttpRouter.add(
  "GET",
  "/api/sentry-test",
  HttpServerResponse.json({
    status: "Sentry test endpoint ready",
    instructions: "POST to this endpoint to trigger a test error",
    sentry_url: "http://localhost:9000",
    verification:
      "After POST, check Sentry at http://localhost:9000 for captured errors",
  }),
)

const SentryTestPost = HttpRouter.add(
  "POST",
  "/api/sentry-test",
  handleSentryTestPost,
)

/**
 * Development console logger — provides pretty console output alongside OTLP.
 * In production, only OTLP logs are emitted (ObservabilityLive replaces the
 * default logger).
 */
const DevConsoleLive = process.env.NODE_ENV === "development"
  ? Logger.layer([Logger.consolePretty()], { mergeWithExisting: true })
  : Layer.empty

const ObservabilityRuntimeLive = Layer.orDie(ObservabilityLive)

/**
 * Server runtime composition — Sentry + OTEL + Console.
 *
 * **Sentry** (@sentry/effect): Errors and distributed traces to Sentry backend.
 * **OTEL** (ObservabilityLive): Traces to Tempo, Logs to Loki (Grafana stack).
 *
 * These are complementary — Sentry captures errors with rich context for
 * debugging, while OTEL provides full observability in Grafana dashboards.
 *
 * Pattern: Layer.provideMerge — merges multiple service layers into runtime.
 */
export const ServerRuntimeLive = TodosApplicationLive.pipe(
  Layer.provideMerge(ObservabilityRuntimeLive),
  Layer.provideMerge(SentryLive),
  Layer.provideMerge(DevConsoleLive),
)

export const AllRoutes = Layer
  .mergeAll(
    RpcRouter,
    HttpApiRouter,
    HealthRoute,
    SentryTestGet,
    SentryTestPost,
  )
  .pipe(Layer.provideMerge(ServerRuntimeLive))

const memoMap = Layer.makeMemoMapUnsafe()

const globalHmr = globalThis as unknown as {
  __EFFECT_DISPOSE__?: () => Promise<void>
  __EFFECT_PROCESS_SHUTDOWN__?: {
    readonly sigintHandler: () => void
    readonly sigtermHandler: () => void
  }
}
if (globalHmr.__EFFECT_DISPOSE__) {
  await globalHmr.__EFFECT_DISPOSE__()
  delete globalHmr.__EFFECT_DISPOSE__
}

initServer()
await initPyroscopeServer()

const { dispose, handler } = HttpRouter.toWebHandler(AllRoutes, {
  memoMap,
})
const effectHandler = ({ request }: { request: Request }) => handler(request)

// ManagedRuntime for use in loaders/server functions
export const serverRuntime = ManagedRuntime.make(ServerRuntimeLive, {
  memoMap,
})

let cleanupPromise: Promise<void> | undefined

const cleanupServerResources = async () => {
  if (cleanupPromise) {
    return cleanupPromise
  }

  cleanupPromise = (async () => {
    await shutdownPyroscopeServer()
    await dispose()
    await serverRuntime.dispose()
  })()

  return cleanupPromise
}

if (!globalHmr.__EFFECT_PROCESS_SHUTDOWN__) {
  const handleProcessShutdown = () => {
    void cleanupServerResources().finally(() => {
      process.exit(0)
    })
  }

  globalHmr.__EFFECT_PROCESS_SHUTDOWN__ = {
    sigintHandler: handleProcessShutdown,
    sigtermHandler: handleProcessShutdown,
  }

  process.once("SIGINT", handleProcessShutdown)
  process.once("SIGTERM", handleProcessShutdown)
}

globalHmr.__EFFECT_DISPOSE__ = async () => {
  if (globalHmr.__EFFECT_PROCESS_SHUTDOWN__) {
    process.off("SIGINT", globalHmr.__EFFECT_PROCESS_SHUTDOWN__.sigintHandler)
    process.off("SIGTERM", globalHmr.__EFFECT_PROCESS_SHUTDOWN__.sigtermHandler)
    delete globalHmr.__EFFECT_PROCESS_SHUTDOWN__
  }

  await cleanupServerResources()
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: effectHandler,
      POST: effectHandler,
      PUT: effectHandler,
      PATCH: effectHandler,
      DELETE: effectHandler,
      OPTIONS: effectHandler,
    },
  },
})
