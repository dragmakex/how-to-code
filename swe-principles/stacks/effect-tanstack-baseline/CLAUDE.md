# Agent Instructions

Prussian virtues: discipline, precision, rigor. 🫡🇩🇪

## Quick Start: What You Need Right Now

**Working on state management (atoms, fetching, mutations)?**
→ Read: `docs/architecture/effect-native-atoms.md` (THIS IS THE PATTERN)

**Working on UI components?**
→ Read: `docs/design-system/rules.md` + inspect `src/design-system/registry.ts`

**Adding a NEW feature?**
→ Read: `docs/guides/adding-new-features.md`
→ Copy **architectural patterns** from `docs/reference/todo/`
→ Build YOUR visual design with `src/design-system/`

**Working on existing features (todos, etc.)?**
→ Read: `docs/architecture/effect-simple-made-easy-mapping.md`

**First time here?**
→ Read: `docs/guides/getting-started.md` then `docs/architecture/overview.md`

---

## Intent

This file is an **index**, not a full handbook. Follow the referenced documents instead of duplicating their rules here.

Use **FFF** (fuzzy file finder) to grab what you need:

- `fffind pattern` to find files by path/name
- `ffgrep pattern` to find content in files
- Search for `Pattern:` headers in source for canonical implementations

## 🇩🇪 Engineering Philosophy: German Precision & Minimalism

**YOU MUST EMBODY THESE PRINCIPLES IN EVERY CHANGE:**

### Root Cause, Not Symptoms

- **Fix root causes**, never patch symptoms
- Trace problems to their source, understand the system deeply
- Reject quick fixes that create technical debt
- Question assumptions, verify with evidence

### Minimal Dependencies

- **Use minimal dependencies** - each dependency is a liability
- Prefer standard library and existing project dependencies
- Only add new dependencies when clearly justified and no alternative exists
- Dependencies must be: well-maintained, widely adopted, minimal in scope

### Long-Term Thinking

- **Accept more work now for long-term benefit**
- Write code that will be maintainable in 5 years
- Optimize for clarity and correctness, then performance
- Simple, explicit solutions over clever abstractions

### High Efficiency

- **Every line of code must justify its existence**
- No redundant code, no premature optimization
- Delete more than you add when possible
- Refactor ruthlessly when improving the system

### Precision & Thoroughness

- **Type safety is non-negotiable** - if TypeScript allows `any`, you failed
- **Tests verify behavior** - no untested code paths
- **Documentation explains why** - code shows how, docs explain why
- **Mermaid diagrams for architecture** - visual clarity for complex systems

## Pattern Discovery

### Pattern Headers in Source

Canonical pattern implementations have `Pattern:` headers in their TSDoc:

Search for these in the codebase:

```bash
# Find pattern implementations
ffgrep "Pattern: Context.Service"
ffgrep "Pattern: Effect.gen"
ffgrep "Pattern: Effect-native Atoms (React)"
ffgrep "Pattern: Layer Composition"
ffgrep "Pattern: SSR Atom Hydration"
ffgrep "Pattern: Pure Projection"
ffgrep "Pattern: Event Sink"
ffgrep "Pattern: RpcGroup"
ffgrep "Pattern: HttpApi"
```

### Pattern Index (Progressive Disclosure)

**Core Patterns (always relevant):**

| Pattern                     | File                                       | Use When              |
| --------------------------- | ------------------------------------------ | --------------------- |
| Effect-native Atoms (React) | `docs/architecture/effect-native-atoms.md` | Any state management  |
| Context.Service (Simple)    | `src/api/api-client.ts`                    | Injectable services   |
| Layer Composition           | `src/routes/api/$.ts`                      | Server runtime wiring |
| SSR Atom Hydration          | `src/lib/atom-hydration.tsx`               | SSR with atoms        |

**Feature Patterns:**

| Pattern                 | File                                                   | Use When           |
| ----------------------- | ------------------------------------------------------ | ------------------ |
| Effect-simple-made-easy | `docs/architecture/effect-simple-made-easy-mapping.md` | Building features  |
| Template CRUD           | `docs/architecture/template-simple-crud.md`            | New CRUD features  |
| Pure Projection         | `src/features/todos/projections.ts`                    | Read models        |
| Event Sink              | `src/features/todos/events.ts`                         | Replication/outbox |

---

## Documentation Map

### By Task (Progressive Disclosure)

**Level 1: You Know What You're Doing**

```
State management  → docs/architecture/effect-native-atoms.md
UI components     → docs/design-system/rules.md
NEW feature       → docs/guides/adding-new-features.md
Existing features → docs/architecture/effect-simple-made-easy-mapping.md
Server API        → src/routes/api/$.ts (read the file)
Database          → docs/guides/database-pglite.md
```

**Level 2: You Need Context**

```
Architecture overview → docs/architecture/overview.md
System guarantees     → docs/architecture/GUARANTEES.md
Code quality          → docs/guides/code-quality.md
Testing               → docs/guides/testing.md
```

**Level 3: Deep Dives**

```
Simple Made Easy philosophy → docs/architecture/simple-made-easy.md
Effect-TS patterns        → .repos/effect/packages/effect/src/
LAOS observability stack  → docs/LAOS_STACK.md
```

### By Directory Structure

```
docs/
├── architecture/           # System patterns and decisions
│   ├── effect-native-atoms.md      ← START HERE for state
│   ├── effect-simple-made-easy-mapping.md
│   ├── overview.md
│   └── GUARANTEES.md
├── app/                    # Feature documentation
│   ├── todo-dashboard.md
│   └── simple-made-easy/
├── design-system/          # UI patterns
│   └── rules.md            ← START HERE for UI
├── guides/                 # How-to guides
│   ├── getting-started.md
│   ├── adding-new-features.md  ← START HERE for new features
│   ├── code-quality.md
│   ├── testing.md
│   └── versioncontrol.md   ← MUST READ for commits
└── LAOS_STACK.md          # Observability stack
```

## Mandatory Workflow

Before implementation:

- isolate the work and follow `docs/guides/versioncontrol.md`
- read only the relevant docs and understand how the change fits the system
- check `package.json` for the available verification scripts

During implementation:

- follow existing patterns
- avoid `any` and unjustified casts
- keep changes small and coherent
- add or update tests alongside the code
- commit in logical steps using the version control guide

After implementation:

- run `bun run validate`
- if needed, also run narrower checks such as `bun run typecheck`, `bun run lint`, `bun run test:coverage`, and `bun run build`
- update docs when the change affects architecture, behavior, or operational understanding

## Reference Repositories

### Effect Work

Before implementing substantial Effect code, read `.repos/effect/` — the Effect repository is included as a squashed subtree:

```bash
# Find pattern implementations in Effect source
ffgrep "Pattern:" .repos/effect/packages/effect/src/

# Key areas to study
.repos/effect/packages/effect/src/unstable/reactivity/Atom.ts
.repos/effect/packages/effect/src/unstable/rpc/
.repos/effect/packages/atom/react/src/
```

Extract best practices from their implementation patterns.

### Drizzle Work

The Drizzle ORM source is vendored at `.repos/drizzle/` (v1.0.0-rc.2) for reference:

```bash
# Find Drizzle implementation patterns
.repos/drizzle/drizzle-orm/src/
.repos/drizzle/drizzle-orm/src/pg-core/        # PostgreSQL core
.repos/drizzle/drizzle-orm/src/pglite/          # PGlite driver
.repos/drizzle/drizzle-kit/src/                  # Migrations
```

Use this when implementing database schema, queries, or understanding Drizzle internals.

## What To Avoid

- ❌ working directly on `master` or `main`
- ❌ giant undifferentiated commits
- ❌ skipping validation
- ❌ adding dependencies without clear justification
- ❌ duplicating logic when a shared abstraction is warranted
- ❌ writing documentation that merely repeats code
- ❌ creating design-system wrapper components that are just a div with a className
- ❌ adding to `src/design-system/` without registering in `registry.ts` and justifying via the decision framework
- ❌ **NEVER vendor** into this repo - use proper dependencies
- ❌ **mixing state patterns** (useState + atoms, runPromise in components) - use Effect-native Atoms
- ❌ using `Effect.runPromise` in components - use atom mutations via hooks

## Mandatory Workflow

### Before Implementation

1. **Isolate work** → follow `docs/guides/versioncontrol.md`
2. **Read relevant patterns** → from this index
3. **Check package.json** → for verification scripts
4. **Find existing implementations** → `ffgrep "Pattern: ..."`

### During Implementation

1. **Follow existing patterns** → copy from `src/atoms.ts`, `src/features/todos/`
2. **Avoid `any`** and unjustified casts
3. **Keep changes small and coherent**
4. **Add/update tests** alongside code
5. **Commit in logical steps** using version control guide

### After Implementation

1. **Run `bun run validate`**
2. **Run narrower checks if needed:**
   - `bun run typecheck`
   - `bun run lint`
   - `bun run test:coverage`
   - `bun run build`
3. **Update docs** when affecting architecture or behavior
4. **Commit** with detailed message per `docs/guides/versioncontrol.md`

---

## Definition Of Done

The change is only done when:

- ✅ Implementation satisfies the pattern
- ✅ Tests verify behavior
- ✅ Documentation explains why (if architectural)
- ✅ Version control history is clean and detailed
- ✅ `bun run validate` passes
- ✅ No `any` types or unjustified casts
- ✅ One pattern used throughout (no mixing)

## Take notes

Please make note of mistakes you make in MISTAKES.md. If you find you wish you had more context or tools, write that down in DESIRES.md. If you learn anything about your env write that down in LEARNINGS.md.
Make sure to consult these files yourself too. do not add duplicates.

## 📖 Remember

You are not just writing code. You are maintaining a system.

Every change you make will be read, debugged, and modified by future maintainers (including future you). Write code and documentation with the precision and thoroughness of a German technical manual. Fix root causes. Use minimal dependencies. Think long-term. Verify everything.

Quality is not optional. It is the baseline.

When in doubt, ask yourself: "Would this pass a German engineering inspection?" If no, keep working.

respond by adding Prussian virtues and a 🫡🇩🇪 flag.
