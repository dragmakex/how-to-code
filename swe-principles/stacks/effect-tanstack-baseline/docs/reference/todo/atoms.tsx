/**
 * Pattern: Effect-native Atoms (React)
 * Purpose: Reactive state management with @effect/atom-react, SSR hydration support,
 * and optimistic updates via writable async atoms
 * See: docs/architecture/effect-native-atoms.md (THE PATTERN DOCUMENTATION)
 * See: docs/guides/adding-new-features.md (HOW TO COPY THIS PATTERN)
 */

import { ApiClient } from "@/api/api-client"
import type {
  CreateTodoInput,
  TodoDashboardSnapshot,
  TodoId,
  UpdateTodoInput,
} from "@/api/todo-schema"
import { TodoDashboardSnapshot as TodoDashboardSnapshotSchema } from "@/api/todo-schema"
import { serializable } from "@/lib/atom-utils"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as RpcClientError from "effect/unstable/rpc/RpcClientError"

const TodoDashboardAsyncResultSchema = AsyncResult.Schema({
  success: TodoDashboardSnapshotSchema,
  error: RpcClientError.RpcClientError,
})

class Api extends Context.Service<Api>()("@app/index/Api", {
  make: Effect.gen(function*() {
    const { rpc } = yield* ApiClient

    return {
      snapshot: () => rpc.todos_snapshot(),
      create: (input: CreateTodoInput) => rpc.todos_create({ input }),
      update: (id: TodoId, input: UpdateTodoInput) =>
        rpc.todos_update({ id, input }),
      remove: (id: TodoId) => rpc.todos_remove({ id }),
    } as const
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(ApiClient.layer),
  )
}

export const runtime = Atom.runtime(Api.layer)

type ReplaceValue<A> = {
  readonly _tag: "Replace"
  readonly value: A
}

/**
 * Wraps a remote async atom so successful values can be replaced locally.
 *
 * @param remoteAtom - The remote async atom to wrap.
 * @returns A writable async atom with refresh support.
 */
function makeWritableAsyncAtom<A>(
  remoteAtom: Atom.Atom<
    AsyncResult.AsyncResult<A, RpcClientError.RpcClientError>
  >,
) {
  return Atom.writable(
    (get) => get(remoteAtom),
    (ctx, update: ReplaceValue<A>) => {
      ctx.setSelf(AsyncResult.success(update.value))
    },
    (refresh) => {
      refresh(remoteAtom)
    },
  )
}

const dashboardSnapshotRemoteAtom = runtime
  .atom(
    Effect.gen(function*() {
      const api = yield* Api
      return yield* api.snapshot()
    }),
  )
  .pipe(
    serializable({
      key: "@app/index/todo-dashboard",
      schema: Schema.toCodecJson(TodoDashboardAsyncResultSchema),
    }),
  )

export const dashboardSnapshotAtom = Object.assign(
  makeWritableAsyncAtom(dashboardSnapshotRemoteAtom),
  {
    remote: dashboardSnapshotRemoteAtom,
  },
)

/**
 * Derives a read-only async atom from the shared dashboard snapshot atom.
 *
 * @param selector - Projection applied to successful dashboard snapshots.
 * @returns A derived async atom with a matching remote projection.
 */
function mapSnapshotAtom<A>(
  selector: (snapshot: TodoDashboardSnapshot) => A,
) {
  const remote = dashboardSnapshotRemoteAtom.pipe(
    Atom.map((result) => AsyncResult.map(result, selector)),
  )

  return Object.assign(
    dashboardSnapshotAtom.pipe(
      Atom.map((result) => AsyncResult.map(result, selector)),
    ),
    { remote },
  )
}

export const todosAtom = mapSnapshotAtom((snapshot) => snapshot.todos)

export const todoStatsAtom = mapSnapshotAtom((snapshot) => snapshot.stats)

export const todoGroupsAtom = mapSnapshotAtom((snapshot) => snapshot.groups)

const replaceDashboardSnapshot = (
  get: {
    readonly set: (
      atom: typeof dashboardSnapshotAtom,
      update: ReplaceValue<TodoDashboardSnapshot>,
    ) => void
  },
  snapshot: TodoDashboardSnapshot,
) => {
  get.set(dashboardSnapshotAtom, { _tag: "Replace", value: snapshot })
}

export const createTodoAtom = runtime.fn<CreateTodoInput>()(
  Effect.fnUntraced(function*(input, get) {
    const api = yield* Api
    const snapshot = yield* api.create(input)
    replaceDashboardSnapshot(get, snapshot)
    return snapshot
  }),
)

export const updateTodoAtom = runtime.fn<{
  readonly id: TodoId
  readonly input: UpdateTodoInput
}>()(
  Effect.fnUntraced(function*({ id, input }, get) {
    const api = yield* Api
    const snapshot = yield* api.update(id, input)
    replaceDashboardSnapshot(get, snapshot)
    return snapshot
  }),
)

export const deleteTodoAtom = runtime.fn<TodoId>()(
  Effect.fnUntraced(function*(id, get) {
    const api = yield* Api
    const snapshot = yield* api.remove(id)
    replaceDashboardSnapshot(get, snapshot)
    return snapshot
  }),
)
