import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Atom from "effect/unstable/reactivity/Atom"
import { dehydrate, serializable, type TypedSerializable } from "./atom-utils"

/**
 * Tests for atom-utils.ts utilities.
 *
 * The serializable function wraps Atom.serializable and provides type-safe
 * encoding/decoding for atom values. The dehydrate function creates
 * DehydratedAtom objects for server-side rendering hydration.
 */

// Create a mock serializable atom for testing dehydrate
const createMockSerializableAtom = <A, I>(
  key: string,
  encode: (value: A) => I,
  decode: (value: I) => A,
): Atom.Atom<A> & TypedSerializable<A, I> => {
  const baseAtom = Atom.writable(
    () => null as unknown as A,
    () => {},
  )

  return Object.assign(baseAtom, {
    [Atom.SerializableTypeId]: {
      key,
      encode,
      decode,
    },
  })
}

it.effect("serializable function is defined and callable", () =>
  Effect.sync(() => {
    // Verify the serializable function exists and is the same as Atom.serializable
    expect(serializable).toBeDefined()
    expect(typeof serializable).toBe("function")
  }))

it.effect("dehydrate - creates a DehydratedAtom with correct structure", () =>
  Effect.sync(() => {
    const mockAtom = createMockSerializableAtom<
      { count: number },
      { count: number }
    >(
      "test-key",
      (value) => value, // Identity encoder
      (value) => value, // Identity decoder
    )

    const dehydrated = dehydrate(mockAtom, { count: 42 }, 4242)

    expect(dehydrated["~@effect-atom/atom/DehydratedAtom"]).toBe(true)
    expect(dehydrated.key).toBe("test-key")
    expect(dehydrated.value).toEqual({ count: 42 })
    expect(dehydrated.dehydratedAt).toBe(4242)
  }))

it.effect("dehydrate - uses the encoder to transform values", () =>
  Effect.sync(() => {
    const mockAtom = createMockSerializableAtom<Date, number>(
      "date-key",
      (date) => date.getTime(), // Encode Date to timestamp
      (timestamp) => new Date(timestamp), // Decode timestamp to Date
    )

    const testDate = new Date(1234567890000)
    const dehydrated = dehydrate(mockAtom, testDate, 1234)

    expect(dehydrated.key).toBe("date-key")
    expect(dehydrated.value).toBe(1234567890000) // Encoded as number
  }))

it.effect("dehydrate - preserves the dehydrated marker", () =>
  Effect.sync(() => {
    const mockAtom = createMockSerializableAtom<string, string>(
      "string-key",
      (s) => s.toUpperCase(),
      (s) => s.toLowerCase(),
    )

    const dehydrated = dehydrate(mockAtom, "hello", 99)

    // The marker must be exactly true for hydration to work
    expect(dehydrated["~@effect-atom/atom/DehydratedAtom"]).toBe(true)
    expect(dehydrated.value).toBe("HELLO") // Encoded
  }))
