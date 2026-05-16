# SWE Principles

A repository of software engineering principles, playbooks, and stack-specific references.

This folder is the companion manual to the root `SKILL.md`.

- `SKILL.md` = compact, agent-facing operating doctrine
- `swe-principles/` = the deeper handbook, reference stack material, checklists, and field guides

The target is broad:

- from idea to PRD
- from architecture to implementation
- from local correctness to production observability
- from feature shipping to security review
- from small tools to battle-tested systems

This repository is intentionally **general by default** and **stack-specific when useful**.

## Working model

1. Read `fields/00-stack-selection.md`
2. Read the general field guides under `fields/`
3. If your stack matches an explicit reference, also read the matching stack guide under `stacks/`
4. Use the checklists under `checklists/` before implementation, review, and release

## Repository structure

```text
swe-principles/
  README.md
  PROVENANCE.md
  fields/
    00-stack-selection.md
    01-discovery-specs-and-prds.md
    02-architecture-and-boundaries.md
    03-state-data-and-guarantees.md
    04-implementation-quality-and-design-systems.md
    05-testing-and-verification.md
    06-version-control-collaboration-and-review.md
    07-observability-performance-and-operations.md
    08-security-and-audit-readiness.md
    09-documentation-skills-and-knowledge-management.md
    10-agentic-engineering-and-human-agency.md
  checklists/
    implementer.md
    reviewer.md
    release-readiness.md
  stacks/
    README.md
    effect-tanstack-baseline/
    effect-tanstack-solid.md
    laos-observability.md
    rust-best-practices.md
    solidity-pashov.md
```

## General principles first

The `fields/` docs are written to apply across:

- backend services
- frontend apps
- CLIs and tools
- distributed systems
- security-sensitive systems
- data and workflow systems
- strongly typed and weakly typed languages

These guides are the default path when:

- your stack has no explicit reference guide here
- you are designing greenfield architecture
- you are reviewing the shape of a system rather than its syntax
- you need software engineering principles that survive framework changes

## Stack-specific references second

The `stacks/` docs exist for cases where the stack matters.

Current stack material:

- `stacks/effect-tanstack-baseline/`
  - direct working-tree copy of `@effect-tanstack-baseline/`
  - use when the stack is close to Effect + TanStack Start + Bun + React
- `stacks/effect-tanstack-solid.md`
  - delta guide for Solid-specific patterns and stronger state/UI/observability ideas
- `stacks/laos-observability.md`
  - overlay guide for local-first correlated observability environments
- `stacks/rust-best-practices.md`
  - Rust overlay based on Apollo GraphQL's `rust-best-practices`
- `stacks/solidity-pashov.md`
  - Solidity security overlay based on Pashov's `solidity-auditor` and `x-ray` skills

The rule is simple:

- **general principles define the architecture and engineering posture**
- **stack guides define the concrete realization when a stack matches**

## What this repository tries to capture

This repository synthesizes ideas from:

- behavior-first specification and elicitation
- PRD discipline and task decomposition
- simple-made-easy architecture
- guarantee hierarchies and defense in depth
- design-system contract enforcement
- architecture-enforcing lint rules
- property-based and invariant-focused testing
- explicit version-control workflows
- observability, tracing, profiling, and health checks
- x-ray style security review and audit readiness
- knowledge management for docs, skills, and repo structure

## Bulgarian precision

This handbook prefers:

- explicit boundaries over fuzzy cleverness
- root-cause fixes over symptom patches
- deterministic workflows over improvisation
- small coherent commits over giant mystery diffs
- verifiable guarantees over motivational slogans
- documentation that teaches operations, not brochure copy

If a principle cannot survive contact with production, it does not belong here.

## Recommended reading order

### If you are starting a new system

1. `fields/01-discovery-specs-and-prds.md`
2. `fields/02-architecture-and-boundaries.md`
3. `fields/03-state-data-and-guarantees.md`
4. `fields/05-testing-and-verification.md`
5. `fields/07-observability-performance-and-operations.md`
6. `fields/08-security-and-audit-readiness.md`
7. `fields/10-agentic-engineering-and-human-agency.md`

### If you are implementing a feature

1. `fields/00-stack-selection.md`
2. `fields/02-architecture-and-boundaries.md`
3. `fields/04-implementation-quality-and-design-systems.md`
4. `fields/05-testing-and-verification.md`
5. `fields/06-version-control-collaboration-and-review.md`
6. `fields/10-agentic-engineering-and-human-agency.md`
7. `checklists/implementer.md`

### If you are reviewing or preparing a release

1. `fields/03-state-data-and-guarantees.md`
2. `fields/06-version-control-collaboration-and-review.md`
3. `fields/08-security-and-audit-readiness.md`
4. `checklists/reviewer.md`
5. `checklists/release-readiness.md`

## Non-goals

This folder is not trying to be:

- a universal framework
- a one-size-fits-all stack prescription
- a replacement for language-specific handbooks
- a replacement for reading your actual codebase

It is a decision aid and reference library.

## Source lineage

See `PROVENANCE.md` for the imported and synthesized source material.