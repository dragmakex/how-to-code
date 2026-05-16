# Simple Made Easy Codification

## Overview

This change turns the repository's simplicity philosophy into enforceable
constraints.

The goal is not to force a generic "functional style". The goal is to keep
modules **unentangled**:

- time should arrive as data,
- randomness should arrive through an explicit boundary,
- route entry modules should delegate instead of orchestrating,
- module exports should stay immutable.

These constraints are intentionally narrow and aimed at the places where this
repository most easily drifts from simple to merely familiar.

They are not a complete mechanical encoding of Rich Hickey's talk. They are
this repository's focused, enforceable interpretation of a few high-signal
failure modes.

## Why this exists

The template already had strong guarantees around type safety, testing, and
observability. What it lacked was a small, explicit policy for **entanglement**.

That gap mattered most in four areas:

1. hidden wall-clock reads in shared code,
2. hidden randomness in persistence code,
3. mutable exports that leak temporal coupling,
4. route entry files that gradually absorb orchestration logic.

## Architecture intent

This feature adds a thin enforcement layer around a simple architectural rule:
**boundaries may sample ambient context; shared logic should receive it as
input**.

### Decisions

#### 1. Time is allowed at boundaries, not hidden in shared helpers

`src/lib/atom-utils.ts` no longer reads `Date.now()` internally. The caller now
supplies `dehydratedAt` explicitly.

That keeps serialization focused on **encoding data**, not **choosing when the
encoding happened**.

#### 2. Repositories must not mint ids from ambient randomness

`src/db/todos-repository.ts` no longer calls `crypto.randomUUID()` directly.
Instead, a `TodoIdGenerator` service provides ids.

`TodoIdGeneratorLive` still samples randomness, but it does so at an explicit
boundary. The goal is not to eliminate randomness. The goal is to isolate where
randomness is chosen so persistence code stays focused on **storage semantics**
while id policy can vary independently.

#### 3. Route entry modules should not become orchestration sinks

The linter now rejects `Effect.gen(...)` in top-level route entry modules. That
rule is a heuristic, not a claim that `Effect.gen` is universally wrong. The
real goal is to keep boundary modules focused on decoding, delegating, and
rendering instead of gradually absorbing orchestration.

The entry module may still call effects, but orchestration belongs in a service
or helper module that can be named, tested, and replaced independently.

## Implementation

### Files changed

```text
eslint-local-rules-advanced.cjs
oxlint.config.js
src/lib/atom-utils.ts
src/lib/todo-id-generator.ts
src/db/todos-repository.ts
src/lint/simple-made-easy-rules.test.ts
```

### Added lint rules

- `local-advanced/no-ambient-time`
- `local-advanced/no-ambient-randomness`
- `local-advanced/no-exported-mutable-bindings`
- `local-advanced/no-effect-gen-in-routes`

### Scope of enforcement

The rules are intentionally scoped to the places where the signal is strong:

- shared library files for ambient time,
- repository files for ambient randomness,
- top-level route entry modules for orchestration,
- feature `application` and `projections` modules for import boundaries,
- UI modules for `db` import boundaries,
- all modules for exported mutable bindings.

This scope is intentionally narrower than Hickey's full argument. It codifies a
small baseline for a TypeScript web template rather than trying to turn the full
talk into lint law.

## Why this is the root-cause fix

The old code had two symptoms:

- hidden time in a serialization helper,
- hidden randomness inside persistence logic.

The root cause was the same in both places: **ambient context was sampled in a
module that should only transform or persist data**.

The refactor removes that entanglement instead of merely documenting it.

## Usage examples

### Good: time passed in at the boundary

```ts
const dehydratedAt = Date.now()
return dehydrate(todosAtom.remote, todos, dehydratedAt)
```

### Bad: shared utility samples time itself

```ts
/**
 * NEGATIVE EXAMPLE ONLY.
 * This snippet exists to illustrate what the linter rejects.
 * Do not copy it into production code.
 */
const dehydrate = (value: unknown) => ({
  value,
  dehydratedAt: Date.now(),
})
```

### Good: repository receives identity from a service

```ts
const todoIdGenerator = yield * TodoIdGenerator
const id = yield * todoIdGenerator.next
```

### Bad: repository samples randomness directly

```ts
/**
 * NEGATIVE EXAMPLE ONLY.
 * This snippet exists to illustrate what the linter rejects.
 * Do not copy it into production code.
 */
const id = crypto.randomUUID()
```

## Example refactor

### Before

```ts
/**
 * Historical negative example.
 * This documents the pre-refactor shape that mixed transformation with
 * ambient time reads. It is not a recommended pattern.
 */
export const dehydrate = (atom, value) => ({
  key: atomKey,
  value,
  dehydratedAt: Date.now(),
})
```

### After

```ts
export const dehydrate = (atom, value, dehydratedAt) => ({
  key: atomKey,
  value,
  dehydratedAt,
})
```

The utility is now a pure transformation over supplied data.

## Trade-offs

### Accepted cost

- a small amount of explicit plumbing,
- one additional service for todo id generation,
- stricter linting in a few focused areas.

### Rejected alternative

We did **not** add a broad style rule such as "ban classes" or "ban loops".
Those rules would create noise without reliably measuring entanglement.

## Verification

The lint rules are verified with both positive and negative examples in
`src/lint/simple-made-easy-rules.test.ts` by invoking Oxlint with the
repository configuration.

The todo feature itself now also serves as the template exemplar for this
boundary split:

- `src/features/todos/application.ts` owns orchestration,
- `src/features/todos/projections.ts` owns pure derivation,
- `src/features/todos/events.ts` owns the replication boundary,
- routes and transport adapters delegate to those feature modules.

Those tests prove that the linter accepts the intended shapes and rejects the
counterexamples we care about.

### Testing notes

- lint rule tests verify intended enforcement,
- `todo-id-generator` tests verify deterministic and production layers,
- full repository validation runs through `bun run validate`.

## Related documents

- `docs/architecture/simple-made-easy.md`
- `docs/guides/code-quality.md`
- `docs/guides/testing.md`
- `docs/architecture/GUARANTEES.md`
