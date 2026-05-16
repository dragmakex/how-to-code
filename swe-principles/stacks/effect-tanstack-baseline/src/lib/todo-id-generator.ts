/**
 * Pattern: Context.Service (Simple)
 * Purpose: Injectable dependency with minimal lifecycle (id generation)
 * See: docs/architecture/effect-simple-made-easy-mapping.md
 */

import { type TodoId, TodoId as TodoIdSchema } from "@/api/todo-schema"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"

const decodeTodoId = Schema.decodeUnknownSync(TodoIdSchema)

export interface TodoIdGenerator {
  readonly next: Effect.Effect<TodoId>
}

export const TodoIdGenerator: Context.Service<
  TodoIdGenerator,
  TodoIdGenerator
> = Context.Service<TodoIdGenerator>("TodoIdGenerator")

export const TodoIdGeneratorLive = Layer.succeed(TodoIdGenerator, {
  next: Effect.sync(() => decodeTodoId(crypto.randomUUID())),
})

/**
 * Creates a deterministic generator layer for tests that need stable ids.
 *
 * @param ids - The ids to yield in order for successive requests.
 * @returns A layer providing a deterministic TodoIdGenerator.
 */
export function makeTodoIdGeneratorTestLayer(
  ids: ReadonlyArray<TodoId>,
): Layer.Layer<TodoIdGenerator> {
  let nextIndex = 0

  return Layer.succeed(TodoIdGenerator, {
    next: Effect.sync(() => {
      const nextId = ids[nextIndex]

      if (nextId === undefined) {
        throw new Error("TodoIdGenerator test ids exhausted")
      }

      nextIndex += 1
      return nextId
    }),
  })
}
