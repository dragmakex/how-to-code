import { TodoId } from "@/api/todo-schema"
import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Schema from "effect/Schema"
import {
  makeTodoIdGeneratorTestLayer,
  TodoIdGenerator,
  TodoIdGeneratorLive,
} from "./todo-id-generator"

const decodeTodoId = Schema.decodeSync(TodoId)

it.effect("makeTodoIdGeneratorTestLayer yields deterministic ids in order", () =>
  Effect
    .gen(function*() {
      const generator = yield* TodoIdGenerator

      const first = yield* generator.next
      const second = yield* generator.next

      expect(first).toBe("todo-first")
      expect(second).toBe("todo-second")
    })
    .pipe(
      Effect.provide(
        makeTodoIdGeneratorTestLayer([
          decodeTodoId("todo-first"),
          decodeTodoId("todo-second"),
        ]),
      ),
    ))

it.effect("makeTodoIdGeneratorTestLayer fails when the deterministic ids are exhausted", () =>
  Effect
    .gen(function*() {
      const generator = yield* TodoIdGenerator

      yield* generator.next
      const exhausted = yield* Effect.exit(generator.next)

      expect(Exit.isFailure(exhausted)).toBe(true)
    })
    .pipe(
      Effect.provide(
        makeTodoIdGeneratorTestLayer([decodeTodoId("todo-only")]),
      ),
    ))

it.effect("TodoIdGenerator.layer produces branded todo ids", () =>
  Effect
    .gen(function*() {
      const generator = yield* TodoIdGenerator
      const generated = yield* generator.next

      expect(typeof generated).toBe("string")
      expect(generated.length).toBeGreaterThan(0)
    })
    .pipe(Effect.provide(TodoIdGeneratorLive)))
