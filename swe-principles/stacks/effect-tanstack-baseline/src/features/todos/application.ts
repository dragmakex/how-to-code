/**
 * Pattern: Effect.gen Workflow
 * Purpose: Use-case orchestration with explicit dependencies (Clock, Repository, EventSink)
 * See: docs/architecture/template-simple-crud.md
 */

import type {
  CreateTodoInput,
  TodoId,
  UpdateTodoInput,
} from "@/api/todo-schema"
import { type TodoSeed, TodosRepository } from "@/db/todos-repository"
import {
  makeTodoEventSinkLayer,
  type TodoEvent,
  TodoEventSink,
  TodoEventSinkNoop,
} from "@/features/todos/events"
import {
  compareTodos,
  deriveTodoDashboardSnapshot,
  deriveTodoGroups,
  deriveTodoStats,
  todoDateFromDateTime,
} from "@/features/todos/projections"
import * as Clock from "effect/Clock"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

const currentTodoDate = Effect.map(
  Clock.currentTimeMillis,
  (now) => todoDateFromDateTime(DateTime.fromDateUnsafe(new Date(now))),
)

const publishEvent = (event: TodoEvent) =>
  Effect.flatMap(TodoEventSink.asEffect(), (sink) => sink.publish(event))

/**
 * List canonical todos in dashboard order.
 *
 * @returns Canonical todos ordered for presentation.
 */
export const listTodos = Effect
  .flatMap(TodosRepository.asEffect(), (repository) => repository.list)
  .pipe(
    Effect.map((todos) => [...todos].sort(compareTodos)),
    Effect.withSpan("TodosApp.list"),
  )

/**
 * Derive dashboard stats from canonical todos and the current clock.
 *
 * @returns Dashboard summary counts.
 */
export const getTodoStats = Effect
  .all([
    TodosRepository.asEffect(),
    currentTodoDate,
  ])
  .pipe(
    Effect.flatMap(([repository, today]) =>
      repository.list.pipe(Effect.map((todos) => deriveTodoStats(todos, today)))
    ),
    Effect.withSpan("TodosApp.stats"),
  )

/**
 * Derive the dashboard snapshot from canonical todos and the current clock.
 *
 * @returns Snapshot used by routes, RPC, and UI hydration.
 */
export const getTodoDashboardSnapshot = Effect
  .all([
    TodosRepository.asEffect(),
    currentTodoDate,
  ])
  .pipe(
    Effect.flatMap(([repository, today]) =>
      repository.list.pipe(
        Effect.map((todos) => deriveTodoDashboardSnapshot(todos, today)),
      )
    ),
    Effect.withSpan("TodosApp.snapshot"),
  )

/**
 * Derive grouped dashboard buckets from canonical todos and the current clock.
 *
 * @returns Dashboard buckets.
 */
export const getTodoGroups = Effect
  .all([
    TodosRepository.asEffect(),
    currentTodoDate,
  ])
  .pipe(
    Effect.flatMap(([repository, today]) =>
      repository.list.pipe(
        Effect.map((todos) => deriveTodoGroups(todos, today)),
      )
    ),
    Effect.withSpan("TodosApp.groups"),
  )

/**
 * Load one todo by id.
 *
 * @param id - Todo identifier.
 * @returns The matching todo.
 */
export const getTodoById = (id: TodoId) =>
  Effect
    .flatMap(TodosRepository.asEffect(), (repository) => repository.getById(id))
    .pipe(
      Effect.withSpan("TodosApp.getById", {
        attributes: { "todo.id": id },
      }),
    )

/**
 * Create a todo, publish the domain event, and return the refreshed snapshot.
 *
 * @param input - Creation input.
 * @returns Refreshed dashboard snapshot.
 */
export const createTodo = (input: CreateTodoInput) =>
  Effect
    .gen(function*() {
      const repository = yield* TodosRepository
      const occurredAt = DateTime.fromDateUnsafe(
        new Date(yield* Clock.currentTimeMillis),
      )
      const todo = yield* repository.create(input)

      yield* publishEvent({
        _tag: "TodoCreated",
        todo,
        input,
        occurredAt,
      })

      return yield* getTodoDashboardSnapshot
    })
    .pipe(
      Effect.withSpan("TodosApp.create", {
        attributes: {
          "todo.has_due_date": input.dueDate === null ? "false" : "true",
          "todo.title": input.title,
        },
      }),
    )

/**
 * Update a todo, publish the domain event, and return the refreshed snapshot.
 *
 * @param id - Todo identifier.
 * @param input - Update input.
 * @returns Refreshed dashboard snapshot.
 */
export const updateTodo = (id: TodoId, input: UpdateTodoInput) =>
  Effect
    .gen(function*() {
      const repository = yield* TodosRepository
      const occurredAt = DateTime.fromDateUnsafe(
        new Date(yield* Clock.currentTimeMillis),
      )
      const todo = yield* repository.update(id, input)

      yield* publishEvent({
        _tag: "TodoUpdated",
        todo,
        input,
        occurredAt,
      })

      return yield* getTodoDashboardSnapshot
    })
    .pipe(
      Effect.withSpan("TodosApp.update", {
        attributes: { "todo.id": id },
      }),
    )

/**
 * Remove a todo, publish the domain event, and return the refreshed snapshot.
 *
 * @param id - Todo identifier.
 * @returns Refreshed dashboard snapshot.
 */
export const removeTodo = (id: TodoId) =>
  Effect
    .gen(function*() {
      const repository = yield* TodosRepository
      const occurredAt = DateTime.fromDateUnsafe(
        new Date(yield* Clock.currentTimeMillis),
      )

      yield* repository.remove(id)
      yield* publishEvent({
        _tag: "TodoRemoved",
        id,
        occurredAt,
      })

      return yield* getTodoDashboardSnapshot
    })
    .pipe(
      Effect.withSpan("TodosApp.remove", {
        attributes: { "todo.id": id },
      }),
    )

export const TodosApplicationLive = Layer.mergeAll(
  TodosRepository.layer,
  TodoEventSinkNoop,
)

/**
 * Create a seeded application layer for integration-style tests.
 *
 * @param seed - Deterministic seed rows.
 * @returns Layer with seeded persistence and no-op events.
 */
export const layerFromTodoSeed = (seed: TodoSeed) =>
  Layer.mergeAll(TodosRepository.layerFromSeed(seed), TodoEventSinkNoop)

/**
 * Create a seeded application layer with an inspectable event sink.
 *
 * @param seed - Deterministic seed rows.
 * @param onPublish - Event callback.
 * @returns Layer with seeded persistence and custom event sink.
 */
export const layerFromTodoSeedWithEvents = (
  seed: TodoSeed,
  onPublish: (event: TodoEvent) => void,
) =>
  Layer.mergeAll(
    TodosRepository.layerFromSeed(seed),
    makeTodoEventSinkLayer(onPublish),
  )
