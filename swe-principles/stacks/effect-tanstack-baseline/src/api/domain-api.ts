/**
 * Pattern: HttpApi Definition
 * Purpose: Type-safe HTTP contract using effect/unstable/httpapi
 * See: docs/architecture/effect-simple-made-easy-mapping.md
 */

import * as Schema from "effect/Schema"
import * as HttpApi from "effect/unstable/httpapi/HttpApi"
import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint"
import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup"
import {
  CreateTodoInput,
  Todo,
  TodoDashboardSnapshot,
  TodoGroup,
  TodoId,
  TodoNotFound,
  TodoStats,
  UpdateTodoInput,
} from "./todo-schema"

export class TodosApiGroup extends HttpApiGroup
  .make("todos")
  .add(
    HttpApiEndpoint.get("list", "/todos", {
      success: Schema.Array(Todo),
    }),
  )
  .add(
    HttpApiEndpoint.get("stats", "/todos/stats", {
      success: TodoStats,
    }),
  )
  .add(
    HttpApiEndpoint.get("groups", "/todos/groups", {
      success: Schema.Array(TodoGroup),
    }),
  )
  .add(
    HttpApiEndpoint.get("snapshot", "/todos/snapshot", {
      success: TodoDashboardSnapshot,
    }),
  )
  .add(
    HttpApiEndpoint.get("getById", "/todos/:id", {
      params: { id: TodoId },
      success: Todo,
      error: TodoNotFound,
    }),
  )
  .add(
    HttpApiEndpoint.post("create", "/todos", {
      payload: CreateTodoInput,
      success: TodoDashboardSnapshot,
    }),
  )
  .add(
    HttpApiEndpoint.patch("update", "/todos/:id", {
      params: { id: TodoId },
      payload: UpdateTodoInput,
      success: TodoDashboardSnapshot,
      error: TodoNotFound,
    }),
  )
  .add(
    HttpApiEndpoint.delete("remove", "/todos/:id", {
      params: { id: TodoId },
      success: TodoDashboardSnapshot,
      error: TodoNotFound,
    }),
  )
{}

export class DomainApi extends HttpApi
  .make("api")
  .add(TodosApiGroup)
  .prefix("/api")
{}
