# Effect TanStack Solid

This file is the Solid-specific delta guide.

Read this **after** the general field guides and **alongside** the imported `effect-tanstack-baseline/` material when your stack is:

- Solid 2.x
- Effect
- TanStack Router / Start
- Bun
- typed server/client boundaries

## Why this stack matters

The Solid variant sharpens several ideas that are only implicit in the React baseline:

1. **one canonical async state model**
2. **no `runPromise` leakage into components**
3. **derived views as projections, not parallel state**
4. **design-system enforcement as a build contract**
5. **observability wired as part of runtime composition**
6. **performance budgets and browser/visual tests treated as first-class**

## Primary files to study in the source stack

If you have the source stack available, read these first:

- `docs/architecture/effect-native-atoms.md`
- `docs/architecture/GUARANTEES.md`
- `docs/design-system/rules.md`
- `docs/design-system/enforcement.md`
- `docs/guides/adding-new-features.md`
- `docs/guides/testing.md`
- `docs/guides/versioncontrol.md`
- `docs/guides/code-quality.md`
- `docs/LAOS_STACK.md`
- `TESTING_AND_TELEMETRY.md`
- `docs/app/todo-dashboard-data-flow.md`

## Solid-specific rules worth carrying forward

## 1. Effect-native atoms are the canonical state pattern

Use the Solid atom runtime for server-backed async state.

The important idea is not the library name. The important idea is:

- the UI reads from one canonical async model
- derived views are projections of that model
- mutations write through a single runtime path
- hydration and revalidation are deliberate, not improvised

Avoid mixed state ownership for the same data.

Do not keep:

- server snapshot in one place
- derived counts in another place
- filtered lists in a third place
- optimistic local patches in a fourth place

That creates drift.

## 2. No low-level async runtime leakage in components

In this stack, components should not manually execute Effect programs.

Generalized rule:

- components trigger named mutations
- runtime machinery handles execution
- UI code should not know transport/runtime plumbing unless it is the boundary itself

For this stack specifically:

- avoid `Effect.runPromise` in component code
- keep async control in atoms, runtime functions, or route boundaries

## 3. Async state must be modeled explicitly

`AsyncResult`-style modeling matters.

Every data surface should have explicit handling for:

- initial
- loading / waiting
- success
- failure
- refresh / revalidation

Do not collapse everything into `data | null` plus a boolean soup.

## 4. Design system is a contract

The Solid stack makes the UI rules unusually strict. Keep them.

- no ad-hoc `className` usage in application code when the design system exists
- no inline styles without an explicit reason
- design-system components must be registered and justified
- exceptions require a written reason marker

General lesson:

When a UI system is large enough to need consistency, enforce the contract with:

- type signatures
- registry / ownership conventions
- lint rules
- staged / CI verification

## 5. Observability must be composed into the runtime

This stack is strong on runtime wiring.

The lesson is universal:

- traces, logs, and error reporting must be added at composition time
- do not assume building the pieces means they are active
- verify telemetry end-to-end after wiring

This stack also emphasizes:

- route/request spans
- service-level spans
- structured logs with correlation fields
- health and readiness endpoints

## 6. Performance is a contract

The Solid stack treats bundle budgets and validation as automated checks.

Carry this forward:

- define performance limits explicitly
- verify them in CI
- distinguish user-facing payload budgets from server sanity limits
- compare before/after when optimizing

## 7. Capture mistakes and learnings as first-class project memory

The stack’s `MISTAKES.md` and `LEARNINGS.md` are worth preserving as a discipline.

Use this especially when:

- toolchains have sharp edges
- the runtime has non-obvious constraints
- migration traps keep repeating
- test runners and framework internals are version-coupled

## Concrete deltas vs the baseline stack

Compared to the React baseline, emphasize these when working in Solid:

- `@effect/atom-solid` instead of React hook equivalents
- accessors and explicit narrowing in UI logic
- hydration ordering and SSR atom serialization discipline
- stricter design-system composition posture
- stronger browser / visual testing and performance gate culture

## If the stack only partially matches

Steal these ideas even if you are not using Solid:

- one canonical async state source
- no runtime plumbing leakage into UI
- derived views as projections
- explicit async surface states
- design-system contract enforcement
- observability composition verification
- performance budgets in CI

Those are the real payload.