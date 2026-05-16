import { expect, it } from "@effect/vitest"
import * as EffectArray from "effect/Array"
import * as Effect from "effect/Effect"
import * as Stream from "effect/Stream"
import { addRpcErrorLogging, getBaseUrl } from "./api-client"

/**
 * Tests for api-client.ts utilities.
 */

it.effect("addRpcErrorLogging - wraps Effect functions with error logging", () =>
  Effect.gen(function*() {
    const mockClient = {
      someMethod: () => Effect.succeed("result"),
    }

    const wrapped = addRpcErrorLogging(mockClient)
    const result = yield* wrapped.someMethod()

    expect(result).toBe("result")
  }))

it.effect("addRpcErrorLogging - logs errors on Effect failure", () =>
  Effect.gen(function*() {
    const mockClient = {
      failingMethod: () => Effect.fail("test-error"),
    }

    const wrapped = addRpcErrorLogging(mockClient)
    const result = yield* Effect.exit(wrapped.failingMethod())

    // The method should still fail, but error logging is added
    expect(result._tag).toBe("Failure")
  }))

it.effect("addRpcErrorLogging - handles nested objects", () =>
  Effect.gen(function*() {
    const mockClient = {
      nested: {
        deepMethod: () => Effect.succeed("deep-result"),
      },
    }

    const wrapped = addRpcErrorLogging(mockClient)
    const result = yield* wrapped.nested.deepMethod()

    expect(result).toBe("deep-result")
  }))

it.effect("addRpcErrorLogging - passes through non-Effect values", () =>
  Effect.sync(() => {
    const mockClient = {
      syncMethod: () => "sync-result",
    }

    const wrapped = addRpcErrorLogging(mockClient)
    const result = wrapped.syncMethod()

    expect(result).toBe("sync-result")
  }))

it.effect("addRpcErrorLogging - handles Stream functions", () =>
  Effect.gen(function*() {
    const mockClient = {
      streamMethod: () => Stream.succeed("stream-value"),
    }

    const wrapped = addRpcErrorLogging(mockClient)
    const result = wrapped.streamMethod()

    // Run the stream and verify the value
    const values = yield* Stream.runCollect(result)
    expect(EffectArray.fromIterable(values)).toEqual(["stream-value"])
  }))

it.effect("addRpcErrorLogging - logs errors on Stream failure", () =>
  Effect.gen(function*() {
    const mockClient = {
      failingStream: () => Stream.fail("stream-error"),
    }

    const wrapped = addRpcErrorLogging(mockClient)
    const result = yield* Effect.exit(
      Stream.runCollect(wrapped.failingStream()),
    )

    // The stream should still fail, but error logging is added
    expect(result._tag).toBe("Failure")
  }))

it.effect("addRpcErrorLogging - preserves this binding", () =>
  Effect.gen(function*() {
    class MyClient {
      value = "client-value"

      /**
       * Returns the value bound to this instance.
       * @returns Effect containing the client value.
       */
      getThis() {
        return Effect.succeed(this.value)
      }
    }

    const client = new MyClient()
    const wrapped = addRpcErrorLogging(client)
    const result = yield* wrapped.getThis()

    expect(result).toBe("client-value")
  }))

it.effect("addRpcErrorLogging - handles deeply nested values", () =>
  Effect.gen(function*() {
    const mockClient = {
      level1: {
        level2: {
          level3: {
            method: () => Effect.succeed("nested-result"),
          },
          plainValue: "not-a-function",
        },
      },
    }

    const wrapped = addRpcErrorLogging(mockClient)
    const result = yield* wrapped.level1.level2.level3.method()

    expect(result).toBe("nested-result")
    // Non-function values should be preserved
    expect(wrapped.level1.level2.plainValue).toBe("not-a-function")
  }))

it.effect("getBaseUrl - uses window origin when available", () =>
  Effect.sync(() => {
    expect(getBaseUrl({ location: { origin: "https://example.com" } })).toBe(
      "https://example.com",
    )
  }))

it.effect("getBaseUrl - falls back to localhost when window is undefined", () =>
  Effect.sync(() => {
    expect(getBaseUrl(null)).toBe("http://localhost:3000")
  }))
