# Stack Selection

Start here.

This repository separates **general software engineering principles** from **stack-specific realizations**.

The general material is the default. The stack material is an overlay.

## Decision rule

Use the general field guides when:

- you are choosing architecture
- your stack is not represented here
- your problem is bigger than framework syntax
- you need principles that survive rewrites, migrations, and platform changes

Use a stack guide in addition to the general field guides when:

- your stack closely matches one of the documented stacks
- the implementation details materially affect state management, runtime wiring, testing, or observability

## How to work

## Path A — no stack match

Read:

1. `01-discovery-specs-and-prds.md`
2. `02-architecture-and-boundaries.md`
3. `03-state-data-and-guarantees.md`
4. `04-implementation-quality-and-design-systems.md`
5. `05-testing-and-verification.md`
6. `06-version-control-collaboration-and-review.md`
7. `07-observability-performance-and-operations.md`
8. `08-security-and-audit-readiness.md`
9. `09-documentation-skills-and-knowledge-management.md`

Then translate the patterns into your host language and toolchain.

## Path B — stack match

Read the same general field guides, then add the stack reference.

Current stack references:

- `../stacks/effect-tanstack-baseline/`
- `../stacks/effect-tanstack-solid.md`
- `../stacks/laos-observability.md`
- `../stacks/rust-best-practices.md`
- `../stacks/solidity-pashov.md`

## Translation rule

Copy the **shape** of the solution, not the nouns.

Examples:

- `routes → application → projections → adapters` is a portable architecture split
- `Effect.assert` is one expression of runtime assertions; use the equivalent in your stack
- `Layer` is one expression of explicit runtime composition; use the equivalent dependency/composition mechanism in your stack
- `design-system registry enforcement` is one expression of UI contract enforcement; implement it with the enforcement tools available in your stack
- `borrow instead of clone` is a Rust-native expression of ownership discipline; use the equivalent cost-aware ownership model in your stack
- `permissionless / role-gated / admin-only entry-point mapping` is a Solidity-native expression of attack-surface modeling; use the equivalent surface map in your stack

## What is stack-specific vs universal?

## Usually universal

- specification and PRD discipline
- boundary-oriented architecture
- guarantee layering
- explicit state ownership
- testing ladders
- observability verification
- version-control discipline
- security review workflows
- knowledge capture

## Usually stack-specific

- exact state management library
- exact RPC or routing system
- exact lint rules and config files
- exact CI commands
- exact runtime composition primitives
- exact browser testing harness

## When to prefer the stack guide heavily

Lean harder on the stack guide when the stack defines:

- your async state model
- your server/client boundary
- your dependency composition model
- your test runner and fixture shape
- your observability runtime wiring

## When to ignore the stack guide

Ignore the stack guide when using it would force:

- libraries your language does not need
- architecture names that obscure your codebase
- framework-specific ceremony without a real boundary problem
- type-system patterns your language already solves differently

## Sanity check before you start

Ask:

1. What part of this problem is universal?
2. What part is caused by my chosen stack?
3. Which guarantees matter regardless of stack?
4. Which implementation details only exist because of this runtime?

Build from the universal part outward.

## Minimum reading for any serious change

Even if you are in a hurry, do not skip:

- architecture and boundaries
- guarantees
- testing and verification
- version control
- observability and operations
- security and audit readiness

Framework syntax is the easy part.
Structural mistakes are what live forever.