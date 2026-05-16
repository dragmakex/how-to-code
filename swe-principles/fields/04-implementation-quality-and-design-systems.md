# Implementation Quality and Design Systems

Implementation quality is not decoration.
It is the accumulation of decisions that make future change either safe or miserable.

This field covers:

- function shape
- naming
- code-quality guardrails
- architecture linting
- UI contract discipline
- anti-slop rules

## One semantic reason per function

Functions should be small because the concept is small.

A good function usually:

1. rejects irrelevant or impossible cases early
2. normalizes inputs once
3. prepares one small piece of explicit state
4. walks the domain logic in source order
5. delegates real branches to named helpers
6. returns a plain value, typed failure, or typed event

A long function can still be good if the phases remain visible.
A short function can still be garbage if it is only abstraction confetti.

## Naming should reveal ownership and lifecycle

Prefer names like:

- `Runtime`
- `Services`
- `Registry`
- `Loader`
- `Manager`
- `Adapter`
- `Diagnostic`
- `SourceInfo`
- `Entry`

These names should correspond to real roles.

Do not use grand nouns for tiny wrappers that justify nothing.

## No escape-hatch engineering

Unsafe convenience accumulates as debt.

General rules:

- do not suppress the host error model casually
- do not cast around type errors unless you can prove the invariant elsewhere
- do not catch-and-ignore failures in the core path
- do not bypass the boundary model for speed
- do not rely on ambient globals where explicit dependencies are possible

If the code only works because the type checker or runtime is being lied to, it does not work.

## Immediate validation discipline

After meaningful edits, run the narrowest relevant verification immediately.

Examples:

- lint the edited files
- typecheck the affected module or package
- run the local test for the changed behavior
- re-run the full suite before handoff or publication

Do not stack ten uncertain edits and hope the final validation will explain which one broke the invariant.

## Code quality should enforce architecture

Linting should do more than ban commas in the wrong place.

High-signal repo rules often include:

- no hidden time in pure modules
- no hidden randomness in persistence/domain helpers
- no mutable exported globals
- no database imports in UI
- no route/controller orchestration sludge
- no unregistered design-system additions
- no bypass of standardized error or async patterns

Treat these as architecture tests.

## Language-native discipline

Write in the host language’s actual strengths.

### Rust
- prefer borrowing over cloning
- use `Result` and explicit error types
- avoid panic/unwrap in production paths
- use type-state when state safety matters

### Go
- favor simple packages and explicit error returns
- keep interfaces small and local to consumers
- do not hide lifecycle behind magical globals

### TypeScript
- use strict mode, unions, validated boundaries, and no `any`
- isolate dynamic data and normalize it early
- encode real domain states, not boolean mush

### Python
- use modules and explicit runtime validation
- prefer simple dataclasses or small classes over giant service soup
- do not confuse framework magic with domain architecture

### C / C++
- make ownership and lifecycle brutally explicit
- pair init/free or constructor/destructor contracts clearly
- isolate OS and device interactions behind adapters

## Design-system discipline

If the project has a design system, treat it as a contract.

That means:

- application code composes design-system primitives/components
- arbitrary styling is constrained or forbidden where appropriate
- new components require a decision framework and explicit ownership
- exceptions must be local, named, and justified

A design system becomes real when it is enforced by:

- type signatures
- registry or ownership rules
- lint rules
- CI or pre-commit checks

## Compose, do not wrap by default

Do not create wrapper components or helpers that merely rename existing composition.

Before adding a component or helper, ask:

- does it replace a native control or hard-to-maintain repeated contract?
- does it encapsulate real state/variant logic?
- does deleting it and inlining the implementation make maintenance harder?

If no, do not add it.

## Pattern selection must be justified

Before adding a registry, manager, service, facade, or controller:

- state the invariant it protects
- show the existing complexity it removes
- show why a plain function or small module is insufficient

If you cannot, drop the pattern.

## Anti-slop workflow

The agent and the human should both resist these failure modes:

- giant unreviewable diffs
- cargo-cult abstractions
- mechanical extension of weak patterns
- repo-wide auto-fix without inspection
- mission-critical changes without explicit design review
- “just build it” when the architecture is still undefined

Push back when the request structure would predictably produce sludge.

## Implement for maintainers you will never meet

Ask of every change:

- can someone explain this six months from now?
- can someone debug it without private context?
- does the name reveal the role?
- does the module tree support the boundary model?
- do the tests prove the interesting part?

If not, the code is not finished.

## Final rule

Implementation quality is what remains after the framework novelty wears off.

Write code that is:

- explicit
- constrained
- locally understandable
- reviewable
- mechanically enforced where possible
- compatible with long-term maintenance