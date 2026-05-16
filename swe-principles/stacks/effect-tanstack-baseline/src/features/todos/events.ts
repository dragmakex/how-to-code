/**
 * Pattern: Event Sink Boundary
 * Purpose: Domain events for replication/async growth (outbox, queues, projectors)
 * See: docs/architecture/template-simple-crud.md
 */

import type {
  CreateTodoInput,
  Todo,
  TodoId,
  UpdateTodoInput,
} from "@/api/todo-schema"
import * as Context from "effect/Context"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

export type TodoEvent =
  | {
    readonly _tag: "TodoCreated"
    readonly todo: Todo
    readonly input: CreateTodoInput
    readonly occurredAt: DateTime.Utc
  }
  | {
    readonly _tag: "TodoUpdated"
    readonly todo: Todo
    readonly input: UpdateTodoInput
    readonly occurredAt: DateTime.Utc
  }
  | {
    readonly _tag: "TodoRemoved"
    readonly id: TodoId
    readonly occurredAt: DateTime.Utc
  }

export interface TodoEventSink {
  readonly publish: (event: TodoEvent) => Effect.Effect<void>
}

export const TodoEventSink: Context.Service<TodoEventSink, TodoEventSink> =
  Context.Service<TodoEventSink>("TodoEventSink")

export const TodoEventSinkNoop = Layer.succeed(TodoEventSink, {
  publish: () => Effect.void,
})

/**
 * Creates an in-memory sink for tests that need to inspect published events.
 *
 * @param onPublish - Callback invoked for every event.
 * @returns A layer providing the sink.
 */
export const makeTodoEventSinkLayer = (
  onPublish: (event: TodoEvent) => void,
): Layer.Layer<TodoEventSink> =>
  Layer.succeed(TodoEventSink, {
    publish: (event) => Effect.sync(() => onPublish(event)),
  })
