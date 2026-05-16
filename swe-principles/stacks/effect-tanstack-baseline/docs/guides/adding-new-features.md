# Adding New Features

## Quick Reference: From Todo Pattern to Your Feature

Use the todo dashboard as your **canonical reference for code structure and architecture**:

**What to copy**: Effect patterns, atom wiring, component structure, RPC integration\
**What to IGNORE**: Visual design, colors, spacing, typography (build your own with the design-system)

**Location**: `docs/reference/todo/` (symlinked to `src/routes/-index/`)

**For new apps**: Study the patterns, then build YOUR visual design:

```bash
# 1. Study the code patterns (atoms, hooks, mutations)
cat docs/reference/todo/atoms.tsx
cat docs/reference/todo/todo-item.tsx
cat docs/reference/todo/create-todo-form.tsx

# 2. Remove the symlink
rm src/routes/-index

# 3. Create YOUR app with YOUR design
mkdir src/routes/-index
# Build using design-system primitives, NOT copying todo visuals
```

## Feature Anatomy

```
src/features/[feature-name]/
├── application.ts      # Use cases, orchestration
├── projections.ts      # Pure read model derivation
├── events.ts           # Domain events (replication boundary)
└── README.md           # Feature docs (if needed)
```

## Step-by-Step: Adding a "Projects" Feature

### 1. Create Feature Directory

```bash
mkdir -p src/features/projects
```

### 2. Domain Types (copy from todo-schema.ts pattern)

```typescript
// src/api/project-schema.ts
import * as Schema from "effect/Schema"

export const ProjectId = Schema.Number
export type ProjectId = typeof ProjectId.Type

export const Project = Schema.Struct({
  id: ProjectId,
  name: Schema.NonEmptyString,
  description: Schema.String,
  status: Schema.Literal("active", "archived"),
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
})
export type Project = typeof Project.Type

// Dashboard snapshot pattern (copy from todo)
export const ProjectDashboardSnapshot = Schema.Struct({
  projects: Schema.Array(Project),
  stats: ProjectStats,
  groups: Schema.Array(ProjectGroup),
})
```

### 3. Application Layer (copy from features/todos/application.ts)

```typescript
// src/features/projects/application.ts
import * as Effect from "effect/Effect"
import { ProjectRepository } from "./project-repository"

export const getProjectDashboard = Effect.gen(function*() {
  const repo = yield* ProjectRepository
  const projects = yield* repo.list()

  // Pure projections (copy pattern from todos/projections.ts)
  return {
    projects,
    stats: calculateProjectStats(projects),
    groups: groupProjectsByStatus(projects),
  }
})

export const createProject = (input: CreateProjectInput) =>
  Effect.gen(function*() {
    const repo = yield* ProjectRepository
    const project = yield* repo.create(input)

    // Return fresh snapshot (pattern from todos)
    return yield* getProjectDashboard
  })
```

### 4. Atoms (extend atoms.tsx or create feature-local atoms)

**Option A: Add to existing atoms.tsx (for tightly coupled features)**

```typescript
// src/routes/-index/atoms.tsx

// Add to existing runtime
export const projectsSnapshotAtom = runtime
  .atom(Effect.gen(function*() {
    const { rpc } = yield* ApiClient
    return yield* rpc.projects_snapshot()
  }))
  .pipe(serializable({...}))

export const createProjectAtom = runtime.fn<CreateProjectInput>()(
  Effect.fnUntraced(function*(input, get) {
    const { rpc } = yield* ApiClient
    const snapshot = yield* rpc.projects_create({ input })
    // Update projects snapshot
    return snapshot
  })
)
```

**Option B: Feature-local atoms (for loose coupling)**

```typescript
// src/routes/projects/atoms.tsx
import { runtime as baseRuntime } from "../-index/atoms"

// Derive from base runtime or create separate
export const projectsRuntime = baseRuntime // Shared runtime
```

### 5. Routes (copy from src/routes/-index/)

```bash
mkdir -p src/routes/projects
```

```typescript
// src/routes/projects/route.tsx
import { createFileRoute } from "@tanstack/react-router"
import { ProjectsPage } from "./projects-page"

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
})
```

```typescript
// src/routes/projects/projects-page.tsx
// COPY PATTERN FROM: src/routes/-index/

import { useAtomSet, useAtomValue } from "@effect/atom-react"
import { createProjectAtom, projectsSnapshotAtom } from "./atoms"

export function ProjectsPage() {
  const snapshot = useAtomValue(projectsSnapshotAtom)
  const createProject = useAtomSet(createProjectAtom)

  // Same pattern as todo components
  // ...
}
```

### 6. UI Components (compose from design-system)

```typescript
// src/routes/projects/projects-list.tsx
import { Card } from "@/design-system/components/Card"
import { Page } from "@/design-system/components/Page"
import { Stack } from "@/design-system/primitives/Stack"

export function ProjectsList() {
  const { projects, createProject } = useProjects()

  return (
    <Page>
      <Stack gap="xl">
        <CreateProjectForm />
        {/* Map over projects */}
      </Stack>
    </Page>
  )
}
```

## Copy-Paste Checklist

When creating a new feature, copy these **architectural patterns** (NOT visual design):

| Copy Structure From                        | To Your App                                | Adapt                              |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------- |
| `docs/reference/todo/../todo-schema.ts`    | `src/api/[feature]-schema.ts`              | Domain types                       |
| `src/features/todos/application.ts`        | `src/features/[name]/application.ts`       | Use cases                          |
| `src/features/todos/projections.ts`        | `src/features/[name]/projections.ts`       | Read models                        |
| `src/features/todos/events.ts`             | `src/features/[name]/events.ts`            | Domain events                      |
| `docs/reference/todo/atoms.tsx`            | `src/routes/[name]/atoms.tsx`              | Atom wiring PATTERN                |
| `docs/reference/todo/create-todo-form.tsx` | `src/routes/[name]/create-[name]-form.tsx` | Form PATTERN (build YOUR UI)       |
| `docs/reference/todo/todo-item.tsx`        | `src/routes/[name]/[name]-item.tsx`        | Item PATTERN (build YOUR UI)       |
| `docs/reference/todo/app.tsx`              | `src/routes/[name]/[name]-page.tsx`        | Page structure (build YOUR layout) |

**⚠️ CRITICAL**: Copy the **Effect patterns, atom wiring, and component structure**.\
**Build YOUR OWN**: Visual design using `src/design-system/` primitives.

## Adding to Atoms.tsx

When your feature needs global atoms (shared with other features), add to route atoms:

```typescript
// src/routes/-index/atoms.tsx

// Section: Projects (add after todos section)
// ============================================
export const projectsSnapshotAtom = runtime.atom(...)
export const createProjectAtom = runtime.fn<CreateProjectInput>()(...)
```

When your feature is self-contained, keep atoms in `src/routes/[name]/atoms.tsx`.

## Route Registration

Routes are auto-discovered by TanStack Router based on file path:

```
src/routes/
├── index.tsx              # /
├── projects/
│   └── index.tsx          # /projects
│   └── $id/
│       └── index.tsx      # /projects/:id
└── api/
    └── $.ts               # /api/*
```

## RPC Registration

Add RPC methods to `src/api/domain-rpc.ts`:

```typescript
export class DomainRpc extends RpcGroup.make(
  "DomainRpc",
  {
    // Existing...
    todos_snapshot: Rpc.effect<TodoDashboardSnapshot>(),

    // Add new...
    projects_snapshot: Rpc.effect<ProjectDashboardSnapshot>(),
    projects_create: Rpc.effect<ProjectDashboardSnapshot, CreateProjectInput>(),
  },
) {}
```

## Testing Pattern

Copy from `src/features/todos/application.test.ts`:

```typescript
// src/features/projects/application.test.ts
import { describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"

describe("Projects Application", () => {
  it.effect("creates project and returns fresh snapshot", () =>
    Effect.gen(function*() {
      // Same pattern as todos test
    }))
})
```

## Common Pitfalls

### ❌ Don't: Create separate runtimes per feature

```typescript
// BAD - Multiple runtimes
export const todosRuntime = Atom.runtime(TodosApi.layer)
export const projectsRuntime = Atom.runtime(ProjectsApi.layer)
```

### ✅ Do: Share runtime or compose layers

```typescript
// GOOD - Shared runtime with composed layers
const AppLayer = TodosApi.layer.pipe(
  Layer.provideMerge(ProjectsApi.layer),
)
export const runtime = Atom.runtime(AppLayer)
```

### ❌ Don't: Mix Effect atoms with React useState for same data

```typescript
// BAD - Confusion
const [signal, setSignal] = useState()
const atomValue = useAtomValue(someAtom)
```

### ✅ Do: Pick one pattern per data type

```typescript
// GOOD - Effect atoms for server data
const snapshot = useAtomValue(dashboardSnapshotAtom)

// Good - useState for pure local UI
const [isOpen, setIsOpen] = useState(false)
```

### ❌ Don't: Use Effect.runPromise in components

```typescript
// BAD - Leaking Effect runtime into component
const handleSubmit = async () => {
  await Effect.runPromise(createProjectEffect(input))
}
```

### ✅ Do: Use atom mutations via hooks

```typescript
// GOOD - Synchronous call, runtime handles async
const createProject = useAtomSet(createProjectAtom)
const handleSubmit = () => {
  createProject(input) // Runtime executes Effect internally
}
```

## Feature Flags / Conditional Features

If you want to keep todo as reference but hide it in production:

```typescript
// src/router.tsx
export const getRouter = () =>
  createRouter({
    routeTree,
    // Filter routes by feature flag
    filterRoutes: (routes) =>
      process.env.ENABLE_TODO === "true"
        ? routes
        : routes.filter(r => !r.path.includes("todo")),
  })
```

## Replacing the Todo Reference with Your App

The todo app in `docs/reference/todo/` is the **architectural reference**.
It's symlinked to `src/routes/-index/` so it runs as the demo.

**⚠️ IMPORTANT DISTINCTION:**

- ✅ **COPY**: How atoms are wired, how mutations work, component composition patterns
- ❌ **IGNORE**: The visual styling, colors, the specific card layouts, the "Prussian" branding

Build YOUR visual identity using the design-system primitives (`src/design-system/`).

### To build your own app:

**Step 1: Remove the symlink**

```bash
rm src/routes/-index
```

**Step 2: Create your app directory**

```bash
mkdir src/routes/-index
```

**Step 3: Copy and adapt (or start fresh)**

```bash
# Option A: Copy todo and adapt
cp docs/reference/todo/* src/routes/-index/
mv src/routes/-index/app.tsx src/routes/-index/my-app.tsx
# ... adapt all files

# Option B: Start from scratch
# Create your own components using patterns from this guide
```

**Step 4: Run your app**

```bash
bun run dev
```

### To restore the todo demo:

```bash
rm -rf src/routes/-index  # Remove your app
ln -s ../../docs/reference/todo src/routes/-index  # Restore symlink
```

## Summary

**The Golden Rule**: Copy the **architectural patterns** completely, then adapt domain types and build YOUR visual design.

### What Stays Identical (Copy These)

- Effect atom patterns (`runtime.atom()`, `runtime.fn()`)
- Hook usage patterns (`useAtomValue`, `useAtomSet`)
- Component composition patterns
- RPC integration patterns
- Testing structure

### What You Build Yourself (Don't Copy)

- Visual design system (colors, spacing, typography)
- Brand identity
- Specific UI layouts
- Component styling

**Use**: `docs/reference/todo/` for code structure\
**Use**: `src/design-system/` + your own creativity for visuals

**Key Files to Study** (Architecture Only, Not Visuals):

Reference Implementation (in docs/ - study the PATTERNS, not the styling):

- `docs/reference/todo/atoms.tsx` - How to wire atoms
- `docs/reference/todo/app.tsx` - Page composition structure
- `docs/reference/todo/create-todo-form.tsx` - Form state patterns
- `docs/reference/todo/todo-item.tsx` - Item update/delete patterns

Core Patterns (in src/):

- `src/routes/-index/atoms.tsx` - How to wire atoms
- `src/features/todos/` - Server-side feature implementation
- `src/api/domain-rpc.ts` - How to add RPC endpoints

**The Symlink**: `src/routes/-index` → `docs/reference/todo`

- Makes the reference runnable
- Remove it when building your own app

---

🫡🇩🇪 **Prussian Efficiency**: Don't reinvent. Copy, adapt, ship.
