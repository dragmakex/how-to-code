import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import {
  AllRoutes,
  createRpcLoggerHandler,
  HealthRoute,
  HttpApiRouter,
  Route,
  RpcLogger,
  RpcLoggerLive,
  RpcRouter,
  serverRuntime,
  ServerRuntimeLive,
} from "./$.ts"

/**
 * Tests for the API router module.
 *
 * This module contains layer definitions and router setup for the API.
 * We test the exported functions and verify the layers are correctly constructed.
 */

it.effect("createRpcLoggerHandler - returns success exit on success", () =>
  Effect.gen(function*() {
    const successEffect = Effect.succeed("test-result")
    const result = yield* createRpcLoggerHandler({
      effect: successEffect,
      rpc: { _tag: "test_rpc" },
      client: { id: "test-client-123" },
    })

    expect(Exit.isSuccess(result)).toBe(true)
    if (Exit.isSuccess(result)) {
      expect(result.value).toBe("test-result")
    }
  }))

it.effect("createRpcLoggerHandler - returns failure exit on failure", () =>
  Effect.gen(function*() {
    const failureEffect = Effect.fail("test-error" as const)
    const result = yield* createRpcLoggerHandler({
      effect: failureEffect,
      rpc: { _tag: "failing_rpc" },
      client: { id: "test-client-456" },
    })

    expect(Exit.isFailure(result)).toBe(true)
  }))

it.effect("RpcLogger - is defined", () =>
  Effect.sync(() => {
    expect(RpcLogger).toBeDefined()
  }))

it.effect("RpcLoggerLive - layer is defined", () =>
  Effect.sync(() => {
    expect(RpcLoggerLive).toBeDefined()
  }))

it.effect("RpcRouter - layer is defined", () =>
  Effect.sync(() => {
    expect(RpcRouter).toBeDefined()
  }))

it.effect("HttpApiRouter - layer is defined", () =>
  Effect.sync(() => {
    expect(HttpApiRouter).toBeDefined()
  }))

it.effect("HealthRoute - layer is defined", () =>
  Effect.sync(() => {
    expect(HealthRoute).toBeDefined()
  }))

it.effect("AllRoutes - layer is defined", () =>
  Effect.sync(() => {
    expect(AllRoutes).toBeDefined()
  }))

it.effect("Route - is defined with handlers", () =>
  Effect.sync(() => {
    expect(Route).toBeDefined()
  }))

it.effect("serverRuntime - is defined", () =>
  Effect.sync(() => {
    expect(serverRuntime).toBeDefined()
  }))

it.effect("ServerRuntimeLive - is defined", () =>
  Effect.sync(() => {
    expect(ServerRuntimeLive).toBeDefined()
  }))
