import { expect, it } from "@effect/vitest"
import * as Clock from "effect/Clock"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Random from "effect/Random"
import * as TestClock from "effect/testing/TestClock"

// Example 1: Testing a simple Effect function
/**
 * Divides two numbers.
 * @param a - The dividend.
 * @param b - The divisor.
 * @returns An `Effect` that succeeds with the quotient or fails with "Cannot divide by zero".
 */
function divide(a: number, b: number) {
  if (b === 0) {
    return Effect.fail("Cannot divide by zero")
  }
  return Effect.succeed(a / b)
}

it.effect("divides two numbers successfully", () =>
  Effect.gen(function*() {
    yield* Effect.scope
    const result = yield* divide(10, 2)
    expect(result).toBe(5)
  }))

it.effect("handles division by zero as Exit", () =>
  Effect.gen(function*() {
    yield* Effect.scope
    const result = yield* Effect.exit(divide(10, 0))
    expect(result).toStrictEqual(Exit.fail("Cannot divide by zero"))
  }))

// Example 2: Using TestClock
it.effect("uses TestClock to simulate time", () =>
  Effect.gen(function*() {
    yield* Effect.scope
    const before = yield* Clock.currentTimeMillis
    expect(before).toBe(0) // TestClock starts at 0

    yield* TestClock.adjust("1000 millis")

    const after = yield* Clock.currentTimeMillis
    expect(after).toBe(1000)
  }))

// Example 3: Using it.live for real environment
it.live("runs with live environment", () =>
  Effect.gen(function*() {
    yield* Effect.scope
    const now = yield* Clock.currentTimeMillis
    // In live mode, this will be the actual current time
    expect(now).toBeGreaterThan(0)
  }))

// Example 4: Resource management with scope
it.effect("manages resources with scope", () =>
  Effect.gen(function*() {
    yield* Effect.scope
    const acquire = Effect.succeed("resource acquired")
    const resource = Effect.acquireRelease(
      acquire,
      () => Console.log("resource released"),
    )

    const value = yield* resource
    expect(value).toBe("resource acquired")
  }))

// Example 5: Using it.flakyTest for tests that may fail randomly
it.effect("handles flaky tests with retry", () => {
  const flaky = Effect.gen(function*() {
    yield* Effect.scope
    const random = yield* Random.nextIntBetween(0, 1)
    if (random === 1) {
      return yield* Effect.fail("Random failure")
    }
    return "success"
  })

  return it.flakyTest(flaky, "5 seconds")
})
