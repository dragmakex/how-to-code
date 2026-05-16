// @vitest-environment node

import { TodoDate, TodoId } from "@/api/todo-schema"
import { makeTodosApplicationTestLayer } from "@/db/todos-test-support"
import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import { createRpcHandlers, TodosRpcLive } from "./todos-rpc-live"
const testToday = Schema.decodeSync(TodoDate)("1970-01-01")

it.effect("createRpcHandlers exposes dashboard and mutation handlers", () =>
  Effect
    .gen(function*() {
      const handlers = yield* createRpcHandlers

      expect(handlers.todos_list).toBeDefined()
      expect(handlers.todos_stats).toBeDefined()
      expect(handlers.todos_groups).toBeDefined()
      expect(handlers.todos_getById).toBeDefined()
      expect(handlers.todos_create).toBeDefined()
      expect(handlers.todos_update).toBeDefined()
      expect(handlers.todos_remove).toBeDefined()
    })
    .pipe(Effect.provide(makeTodosApplicationTestLayer())))

it.effect("dashboard handlers return list, stats, and groups", () =>
  Effect
    .gen(function*() {
      const handlers = yield* createRpcHandlers
      yield* handlers.todos_create({
        input: { title: "RPC Todo", dueDate: testToday },
      })

      const todos = yield* handlers.todos_list()
      const stats = yield* handlers.todos_stats()
      const groups = yield* handlers.todos_groups()

      expect(todos).toHaveLength(1)
      expect(stats.dueToday).toBe(1)
      expect(groups.find((group) => group.key === "today")?.count).toBe(1)
    })
    .pipe(Effect.provide(makeTodosApplicationTestLayer())))

it.effect("mutation handlers return snapshots and keep dashboard views coherent", () =>
  Effect
    .gen(function*() {
      const handlers = yield* createRpcHandlers
      const created = yield* handlers.todos_create({
        input: { title: "Original RPC", dueDate: null },
      })
      const createdTodo = created.todos[0]

      if (createdTodo === undefined) {
        return yield* Effect.die(new Error("Expected created todo"))
      }

      const updated = yield* handlers.todos_update({
        id: createdTodo.id,
        input: {
          title: Option.some("Updated RPC"),
          completed: Option.some(true),
          dueDate: Option.some(testToday),
        },
      })

      expect(updated.todos[0]).toMatchObject({
        title: "Updated RPC",
        completed: true,
      })
      expect(updated.stats.completed).toBe(1)

      const removed = yield* handlers.todos_remove({ id: createdTodo.id })
      expect(removed.todos).toEqual([])
      expect(removed.stats.total).toBe(0)
    })
    .pipe(Effect.provide(makeTodosApplicationTestLayer())))

it.effect("todos_getById and todos_remove fail for missing ids", () =>
  Effect
    .gen(function*() {
      const handlers = yield* createRpcHandlers
      const fakeId = Schema.decodeSync(TodoId)("non-existent-rpc-id")

      const getResult = yield* Effect.exit(
        handlers.todos_getById({ id: fakeId }),
      )
      const removeResult = yield* Effect.exit(
        handlers.todos_remove({ id: fakeId }),
      )

      expect(Exit.isFailure(getResult)).toBe(true)
      expect(Exit.isFailure(removeResult)).toBe(true)
    })
    .pipe(Effect.provide(makeTodosApplicationTestLayer())))

it.effect("setting due date moves todo from unscheduled to correct group", () =>
  Effect
    .gen(function*() {
      const handlers = yield* createRpcHandlers

      const created = yield* handlers.todos_create({
        input: { title: "Unscheduled Task", dueDate: null },
      })
      const todo = created.todos[0]
      expect(todo?.dueDate).toBeNull()
      expect(created.groups.find((g) => g.key === "unscheduled")?.count).toBe(1)

      if (todo === undefined) {
        return yield* Effect.die(new Error("Expected created todo"))
      }

      const updated = yield* handlers.todos_update({
        id: todo.id,
        input: {
          title: Option.none(),
          completed: Option.none(),
          dueDate: Option.some(testToday),
        },
      })

      const updatedTodo = updated.todos.find((t) => t.id === todo.id)
      expect(updatedTodo?.dueDate).toBe(testToday)
      expect(updated.groups.find((g) => g.key === "today")?.count).toBe(1)
      expect(updated.groups.find((g) => g.key === "unscheduled")?.count).toBe(0)
    })
    .pipe(Effect.provide(makeTodosApplicationTestLayer())))

it.effect("clearing due date moves todo back to unscheduled", () =>
  Effect
    .gen(function*() {
      const handlers = yield* createRpcHandlers

      const created = yield* handlers.todos_create({
        input: { title: "Scheduled Task", dueDate: testToday },
      })
      const todo = created.todos[0]
      expect(todo?.dueDate).toBe(testToday)

      if (todo === undefined) {
        return yield* Effect.die(new Error("Expected created todo"))
      }

      const updated = yield* handlers.todos_update({
        id: todo.id,
        input: {
          title: Option.none(),
          completed: Option.none(),
          dueDate: Option.some(null),
        },
      })

      const updatedTodo = updated.todos.find((t) => t.id === todo.id)
      expect(updatedTodo?.dueDate).toBeNull()
      expect(updated.groups.find((g) => g.key === "unscheduled")?.count).toBe(1)
      expect(updated.groups.find((g) => g.key === "today")?.count).toBe(0)
    })
    .pipe(Effect.provide(makeTodosApplicationTestLayer())))

it.effect("TodosRpcLive layer builds successfully", () =>
  Effect.sync(() => {
    expect(TodosRpcLive).toBeDefined()
  }))
