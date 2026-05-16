/**
 * Pattern: RpcServer Handler Binding
 * Purpose: Bind RPC handlers to application workflows via DomainRpc.toLayer
 * See: src/api/domain-rpc.ts for API definition
 */

import { DomainRpc } from "@/api/domain-rpc"
import type {
  CreateTodoInput,
  TodoId,
  UpdateTodoInput,
} from "@/api/todo-schema"
import {
  createTodo,
  getTodoById,
  getTodoDashboardSnapshot,
  getTodoGroups,
  getTodoStats,
  listTodos,
  removeTodo,
  TodosApplicationLive,
  updateTodo,
} from "@/features/todos/application"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

/**
 * RPC handler implementations.
 * These are exported separately for testing.
 */
export const createRpcHandlers = Effect.succeed({
  todos_list: () => listTodos,

  todos_stats: () => getTodoStats,

  todos_groups: () => getTodoGroups,

  todos_snapshot: () => getTodoDashboardSnapshot,

  todos_getById: ({ id }: { id: TodoId }) => getTodoById(id),

  todos_create: ({ input }: { input: CreateTodoInput }) => createTodo(input),

  todos_update: ({ id, input }: { id: TodoId; input: UpdateTodoInput }) =>
    updateTodo(id, input),

  todos_remove: ({ id }: { id: TodoId }) => removeTodo(id),
})

export const TodosRpcLive = DomainRpc
  .toLayer(createRpcHandlers)
  .pipe(Layer.provide(TodosApplicationLive))
