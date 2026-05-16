/**
 * Pattern: HttpApiBuilder Handler Binding
 * Purpose: Bind HTTP handlers to application workflows via HttpApiBuilder.group
 * See: src/api/domain-api.ts for API definition
 */

import { DomainApi } from "@/api/domain-api"
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
import * as Layer from "effect/Layer"
import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder"

/**
 * HTTP API handler implementations.
 * These are exported separately for testing.
 */
export const listHandler = listTodos

export const statsHandler = getTodoStats

export const groupsHandler = getTodoGroups

export const snapshotHandler = getTodoDashboardSnapshot

export const getByIdHandler = (id: TodoId) => getTodoById(id)

export const createHandler = (payload: CreateTodoInput) => createTodo(payload)

export const updateHandler = (id: TodoId, payload: UpdateTodoInput) =>
  updateTodo(id, payload)

export const removeHandler = (id: TodoId) => removeTodo(id)

export const TodosApiLive = HttpApiBuilder
  .group(
    DomainApi,
    "todos",
    (handlers) =>
      handlers
        .handle("list", () => listHandler)
        .handle("stats", () => statsHandler)
        .handle("groups", () => groupsHandler)
        .handle("snapshot", () => snapshotHandler)
        .handle("getById", ({ params }) => getByIdHandler(params.id))
        .handle("create", ({ payload }) => createHandler(payload))
        .handle(
          "update",
          ({ params, payload }) => updateHandler(params.id, payload),
        )
        .handle("remove", ({ params }) => removeHandler(params.id)),
  )
  .pipe(Layer.provide(TodosApplicationLive))
