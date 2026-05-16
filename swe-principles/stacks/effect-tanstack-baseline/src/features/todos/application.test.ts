// @vitest-environment node

import { TodoId } from "@/api/todo-schema"
import { todoSeeds } from "@/db/todos-test-support"
import { expect, it } from "@effect/vitest"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import {
  createTodo,
  getTodoById,
  getTodoDashboardSnapshot,
  layerFromTodoSeed,
  layerFromTodoSeedWithEvents,
  updateTodo,
} from "./application"

it.effect("derives snapshots directly from the application layer", () =>
  Effect
    .gen(function*() {
      const snapshot = yield* getTodoDashboardSnapshot

      expect(snapshot.todos.map((todo) => todo.title)).toEqual([
        "Alpha todo",
        "Charlie todo",
        "Bravo done",
      ])
      expect(snapshot.stats.total).toBe(3)
    })
    .pipe(Effect.provide(layerFromTodoSeed(todoSeeds.mixedState))))

it.effect("publishes create and update events through the application boundary", () => {
  const events: Array<string> = []

  return Effect
    .gen(function*() {
      const created = yield* createTodo({
        title: "Application todo",
        dueDate: null,
      })

      const createdTodo = created.todos[0]
      if (createdTodo === undefined) {
        return yield* Effect.die(new Error("Expected created todo"))
      }

      yield* updateTodo(createdTodo.id, {
        title: Option.some("Application todo updated"),
        completed: Option.some(true),
        dueDate: Option.none(),
      })

      expect(events).toContain("TodoCreated")
      expect(events).toContain("TodoUpdated")
    })
    .pipe(
      Effect.provide(
        layerFromTodoSeedWithEvents(todoSeeds.empty, (event) => {
          events.push(event._tag)
        }),
      ),
    )
})

it.effect("preserves TodoNotFound failures at the application boundary", () =>
  Effect
    .gen(function*() {
      const fakeId = Schema.decodeSync(TodoId)("missing-feature-id")
      const result = yield* Effect.exit(getTodoById(fakeId))

      expect(Exit.isFailure(result)).toBe(true)

      if (Exit.isFailure(result)) {
        const failReason = result.cause.reasons.find(Cause.isFailReason)
        expect(failReason?.error).toMatchObject({
          _tag: "TodoNotFound",
          id: fakeId,
        })
      }
    })
    .pipe(Effect.provide(layerFromTodoSeed(todoSeeds.empty))))
