import type {
  CreateTodoInput,
  TodoId,
  UpdateTodoInput,
} from "@/api/todo-schema"
import { type TodoSeed, TodosRepository } from "@/db/todos-repository"
import {
  createTodo,
  getTodoById,
  getTodoDashboardSnapshot,
  getTodoGroups,
  getTodoStats,
  layerFromTodoSeed,
  listTodos,
  removeTodo,
  TodosApplicationLive,
  updateTodo,
} from "@/features/todos/application"
import { TodoEventSink } from "@/features/todos/events"
import { todoDateFromDateTime } from "@/features/todos/projections"
import * as Context from "effect/Context"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

/**
 * Produces the current UTC day in the todo date format.
 *
 * @returns The current UTC date string.
 */
export function todayDate() {
  return todoDateFromDateTime(DateTime.fromDateUnsafe(new Date()))
}

export class TodosService extends Context.Service<TodosService>()(
  "TodosService",
  {
    make: Effect.gen(function*() {
      const repository = yield* TodosRepository
      const eventSink = yield* TodoEventSink

      const provideRepository = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
        effect.pipe(Effect.provideService(TodosRepository, repository))

      const provideApplication = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
        effect.pipe(
          Effect.provideService(TodoEventSink, eventSink),
          Effect.provideService(TodosRepository, repository),
        )

      return {
        list: provideRepository(listTodos),
        stats: provideRepository(getTodoStats),
        groups: provideRepository(getTodoGroups),
        snapshot: provideRepository(getTodoDashboardSnapshot),
        getById: (id: TodoId) => provideRepository(getTodoById(id)),
        create: (input: CreateTodoInput) =>
          provideApplication(createTodo(input)),
        update: (id: TodoId, input: UpdateTodoInput) =>
          provideApplication(updateTodo(id, input)),
        remove: (id: TodoId) => provideApplication(removeTodo(id)),
      } as const
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(TodosApplicationLive),
  )

  static readonly testLayer = this.layerFromSeed([])

  /**
   * Creates a service layer backed by an in-memory seeded PGlite repository.
   *
   * @param seed - The deterministic rows to preload before the test runs.
   * @returns A todo service layer for invariant-style tests.
   */
  static layerFromSeed(seed: TodoSeed): Layer.Layer<TodosService> {
    return Layer.effect(this, this.make).pipe(
      Layer.provide(layerFromTodoSeed(seed)),
    )
  }
}
