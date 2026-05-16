# Effect-Native Atoms Pattern

## Intent

The definitive pattern for reactive state management in this codebase: Effect atoms with React via `@effect/atom-react`. This replaces mixed approaches (useState + manual fetch, runPromise leakage) with a unified, end-to-end Effect architecture.

**Pattern header to search for in source**: `Pattern: Effect-native Atoms (React)`

## When to Use

✅ **Always use this pattern** for client-side state that:

- Fetches data from the server
- Mutates server state
- Needs SSR hydration
- Has derived views (stats from list, groups from items)

❌ **Don't use when**:

- Pure local UI state (use `useState` or `Atom.make`)
- One-shot imperative operations (use `Effect.runPromise` at route level)

## The Pattern

### 1. Runtime with Service Layer (src/routes/-index/atoms.tsx)

```typescript
// Pattern: Effect-native Atoms (React)
// Purpose: Injectable RPC client with atom runtime

import { ApiClient } from "@/api/api-client"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Atom from "effect/unstable/reactivity/Atom"

// API Service wrapper
class Api extends Context.Service<Api>()("@app/index/Api", {
  make: Effect.gen(function*() {
    const { rpc } = yield* ApiClient
    return {
      snapshot: () => rpc.todos_snapshot(),
      create: (input) => rpc.todos_create({ input }),
      update: (id, input) => rpc.todos_update({ id, input }),
      remove: (id) => rpc.todos_remove({ id }),
    } as const
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(ApiClient.layer),
  )
}

// Atom runtime with API dependency
export const runtime = Atom.runtime(Api.layer)
```

### 2. Writable Async Atoms for SSR + Optimistic Updates

```typescript
import { serializable } from "@/lib/atom-utils"
import * as Schema from "effect/Schema"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import * as RpcClientError from "effect/unstable/rpc/RpcClientError"

// Schema for serialization
const TodoDashboardAsyncResultSchema = AsyncResult.Schema({
  success: TodoDashboardSnapshotSchema,
  error: RpcClientError.RpcClientError,
})

// Helper: make remote atom writable for optimistic updates
type ReplaceValue<A> = { readonly _tag: "Replace"; readonly value: A }

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

// Main data atom - serializable for SSR
const dashboardSnapshotRemoteAtom = runtime
  .atom(Effect.gen(function*() {
    const api = yield* Api
    return yield* api.snapshot()
  }))
  .pipe(
    serializable({
      key: "@app/todo-dashboard",
      schema: Schema.toCodecJson(TodoDashboardAsyncResultSchema),
    }),
  )

export const dashboardSnapshotAtom = Object.assign(
  makeWritableAsyncAtom(dashboardSnapshotRemoteAtom),
  { remote: dashboardSnapshotRemoteAtom },
)
```

### 3. Derived View Atoms

```typescript
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

export const todosAtom = mapSnapshotAtom((s) => s.todos)
export const todoStatsAtom = mapSnapshotAtom((s) => s.stats)
export const todoGroupsAtom = mapSnapshotAtom((s) => s.groups)
```

### 4. Mutation Atoms (runtime.fn)

```typescript
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

export const updateTodoAtom = runtime.fn<
  { readonly id: TodoId; readonly input: UpdateTodoInput }
>()(
  Effect.fnUntraced(function*({ id, input }, get) {
    const api = yield* Api
    const snapshot = yield* api.update(id, input)
    replaceDashboardSnapshot(get, snapshot)
    return snapshot
  }),
)
```

### 5. Hook Usage in Components (via @effect/atom-react)

```typescript
// Pattern: Effect-native Atoms (React)
// Purpose: Bridge atoms to React components via @effect/atom-react hooks

import { useAtomSet, useAtomValue } from "@effect/atom-react"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"

export function useTodos() {
  // Read: useAtomValue returns AsyncResult state
  const snapshotAsync = useAtomValue(dashboardSnapshotAtom)

  // Mutate: useAtomSet returns setter function
  const createTodo = useAtomSet(createTodoAtom)
  const updateTodo = useAtomSet(updateTodoAtom)
  const deleteTodo = useAtomSet(deleteTodoAtom)

  // Derived states
  const loading = snapshotAsync._tag === "Initial" || snapshotAsync.waiting
  const error = snapshotAsync._tag === "Failure" ? snapshotAsync.cause : null
  const snapshot = AsyncResult.value(snapshotAsync)

  return {
    snapshot,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
  }
}
```

### 6. Components Call Mutations Directly

```typescript
// Pattern: Pure Effect (no runPromise!)
// Purpose: Trigger mutations synchronously, let Effect runtime handle execution

export function TodoItem({ todo }: { todo: Todo }) {
  const { updateTodo, deleteTodo } = useTodos()

  const handleToggle = () => {
    // Synchronous call - Effect runtime handles async internally
    updateTodo({ id: todo.id, input: { completed: !todo.completed } })
  }

  const handleDelete = () => {
    deleteTodo(todo.id)
  }

  return (
    <div>
      <input type="checkbox" checked={todo.completed} onChange={handleToggle} />
      <button onClick={handleDelete}>
        Delete
      </button>
    </div>
  )
}
```

## Why This Pattern

### Before (Anti-pattern)

```typescript
// ❌ Don't: Mixed abstractions, runPromise leakage
const [state, setState] = useState({ _tag: "Loading" })

const fetchData = async () => {
  const data = await apiClient.getSnapshot() // Promise
  setState({ _tag: "Success", data })
}

// In component:
await Effect.runPromise(createTodoEffect(input)) // Effect leaked to component
```

### After (This Pattern)

```typescript
// ✅ Do: Pure Effect atoms, no runPromise in components
const snapshotAsync = useAtomValue(dashboardSnapshotAtom)

// In component - just call the function:
createTodo({ title: "Ship it" }) // Effect runtime handles everything
```

## Key Principles

| Principle                  | Implementation                                    |
| -------------------------- | ------------------------------------------------- |
| **Single Source of Truth** | `dashboardSnapshotAtom` holds canonical state     |
| **Automatic Reactivity**   | `runtime.fn()` mutations trigger atom updates     |
| **No Promise Leakage**     | Components never see `Effect.runPromise`          |
| **SSR-Ready**              | `serializable()` enables hydration from server    |
| **Derived Views**          | `mapSnapshotAtom()` creates read-only projections |
| **Optimistic Updates**     | `makeWritableAsyncAtom()` enables local mutations |

## AsyncResult States

Components must handle these states from `useAtomValue()`:

```typescript
const result = snapshotAsync // AsyncResult<TodoDashboardSnapshot, RpcClientError>

switch (result._tag) {
  case "Initial":
    return <Loading />
  case "Success":
    return <Dashboard data={result.value} />
  case "Failure":
    return <Error error={result.cause} />
}
// result.waiting is true during revalidation
```

## Migration from Mixed Approaches

1. **Replace useState** with `useAtomValue(atom)`
2. **Replace manual fetch** with `runtime.atom(Effect.gen(...))`
3. **Replace `Effect.runPromise`** with `runtime.fn()` + `useAtomSet()`
4. **Remove REST fallback** - use RPC exclusively
5. **Add serializable** for SSR support

## Related Patterns

- `Pattern: Context.Service (Simple)` - API client wiring
- `Pattern: Layer Composition` - Server runtime setup
- `Pattern: SSR Atom Hydration` - Server-side dehydration/hydration
- See: `docs/architecture/effect-simple-made-easy-mapping.md`

## Files to Study

- `src/routes/-index/atoms.tsx` - Complete pattern implementation
- `src/routes/-index/todo-item.tsx` - Mutation usage
- `src/routes/-index/create-todo-form.tsx` - Create mutation usage
- `src/lib/atom-hydration.tsx` - SSR hydration
- `~/git/playground/effect-tanstack-solid/src/routes/-index/atoms.ts` - Solid reference

## Verification Checklist

Before submitting changes:

- [ ] No `Effect.runPromise` in component files
- [ ] No manual `useState` for server data
- [ ] Mutations use `runtime.fn()` with `get.set()` to update atoms
- [ ] Components call mutations synchronously
- [ ] `useAtomValue` handles `AsyncResult` states properly
- [ ] Atoms are serializable for SSR (if hydration needed)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes

---

🫡🇩🇪 **Precision Note**: This pattern embodies German engineering principles: one correct way to do things, minimal abstractions, type safety throughout, and zero leakage between layers.
