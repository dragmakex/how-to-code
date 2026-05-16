// @vitest-environment node

import { TodoDate, TodoId } from "@/api/todo-schema"
import { makeTodosApplicationTestLayer } from "@/db/todos-test-support"
import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import {
  createHandler,
  getByIdHandler,
  groupsHandler,
  listHandler,
  removeHandler,
  statsHandler,
  TodosApiLive,
  updateHandler,
} from "./todos-api-live"
const testToday = Schema.decodeSync(TodoDate)("1970-01-01")

it.effect("list, stats, and groups handlers expose dashboard reads", () =>
  Effect
    .gen(function*() {
      yield* createHandler({ title: "HTTP Todo", dueDate: testToday })

      const todos = yield* listHandler
      const stats = yield* statsHandler
      const groups = yield* groupsHandler

      expect(todos).toHaveLength(1)
      expect(stats.dueToday).toBe(1)
      expect(groups.find((group) => group.key === "today")?.count).toBe(1)
    })
    .pipe(Effect.provide(makeTodosApplicationTestLayer())))

it.effect("create, update, and remove handlers return dashboard snapshots", () =>
  Effect
    .gen(function*() {
      const created = yield* createHandler({
        title: "HTTP Snapshot",
        dueDate: null,
      })
      const createdTodo = created.todos[0]

      if (createdTodo === undefined) {
        return yield* Effect.die(new Error("Expected created todo"))
      }

      const updated = yield* updateHandler(createdTodo.id, {
        title: Option.some("Updated HTTP"),
        completed: Option.some(true),
        dueDate: Option.some(testToday),
      })

      expect(updated.todos[0]).toMatchObject({
        title: "Updated HTTP",
        completed: true,
      })
      expect(updated.stats.completed).toBe(1)

      const removed = yield* removeHandler(createdTodo.id)
      expect(removed.todos).toEqual([])
      expect(removed.stats.total).toBe(0)
    })
    .pipe(Effect.provide(makeTodosApplicationTestLayer())))

it.effect("getByIdHandler and removeHandler return errors for missing ids", () =>
  Effect
    .gen(function*() {
      const fakeId = Schema.decodeSync(TodoId)("non-existent-http-id")

      const getResult = yield* Effect.exit(getByIdHandler(fakeId))
      const removeResult = yield* Effect.exit(removeHandler(fakeId))

      expect(Exit.isFailure(getResult)).toBe(true)
      expect(Exit.isFailure(removeResult)).toBe(true)
    })
    .pipe(Effect.provide(makeTodosApplicationTestLayer())))

it.effect("TodosApiLive layer builds successfully", () =>
  Effect.sync(() => {
    expect(TodosApiLive).toBeDefined()
  }))
