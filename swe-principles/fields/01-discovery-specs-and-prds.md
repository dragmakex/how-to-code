# Discovery, Specs, and PRDs

Good implementation starts before code.

This field covers:

- how to discover what should be built
- how to separate intent from implementation
- how to write a PRD worth handing to engineers
- how to turn a spec into a task plan that can actually be verified

## Start with intent, not code shape

Before asking how to build something, ask what behavior matters.

Use these questions first:

- What is the boundary of the system or feature?
- What is explicitly in scope?
- What is explicitly out of scope?
- Who are the actors?
- What is the one-sentence promise?
- What changes in the world when this succeeds?

If these are unclear, implementation is already too early.

## What vs how

A useful decision rule:

- if changing it would still leave the system meaningfully the same, it is probably implementation
- if changing it would make it a different system, it is probably part of the spec

Examples:

- “uses PostgreSQL” → usually implementation
- “supports guest checkout” → product behavior
- “expires in 7 days” → often product behavior
- “uses Redis for sessions” → implementation
- “requires admin approval before reinstatement” → behavioral rule

## Scope comments are not optional

Every serious spec or PRD should state:

- scope
- includes
- excludes
- dependencies
- open questions

This prevents accidental expansion and quiet redefinition halfway through implementation.

## Happy path first

Do not begin with the pathological edge case cemetery.

The right order is:

1. define the happy path
2. define the states and transitions
3. define the major failure paths
4. define timeouts, retries, escalations, and reversals
5. refine with precise contracts and invariants

If the happy path is unclear, the rest is theater.

## Terminology discipline

Each concept should have one name.

Do not tolerate:

- `Order` vs `Purchase`
- `Workspace` vs `Project`
- `Member` vs `User` when they mean the same thing

A comment saying “these are equivalent” is a bug report, not a solution.

Pick one term and propagate it consistently.

## PRD minimum bar

A PRD is incomplete if it lacks any of the following:

- plain-language overview
- one-sentence promise
- demo script
- measurable success outcomes
- explicit user flows
- explicit error flows
- non-goals
- no-gos
- data contracts with valid/invalid examples
- state machines where state matters
- invariants
- monitoring expectations
- rollout and rollback
- Given/When/Then acceptance criteria
- open questions

This is the threshold for handoff, not a luxury version.

## PRD verification checklist

A PRD should be rejected if it fails any of these tests:

### Clarity
- every requirement is testable
- ambiguous words are replaced by measurable behavior
- every important screen or interface has explicit states

### Completeness
- edge cases are named
- dependencies are listed
- config and secrets are identified
- rollout and rollback exist

### Guarantees
- critical invariants are explicit
- each invariant has at least one verification path
- each invariant has at least one operational signal when applicable

### Traceability
- requirements map to acceptance criteria
- acceptance criteria can map to tasks

### Feasibility
- current infra can support the design, or the gaps are stated

## Criticality tiers

Every substantial piece of work should be classified.

| Tier | Typical domain | Required rigor |
| --- | --- | --- |
| T1 | money, auth, signing, irreversible state | full guarantee stack + simulation thinking |
| T2 | user data, business rules, state machines | strong guarantees across types/runtime/persistence/tests/monitoring |
| T3 | standard feature work | solid types, runtime validation, tests |
| T4 | low-risk telemetry or internal glue | lightweight but explicit correctness |

When unsure, tier up.

## Definition of done must match risk

Do not use the same DoD for a danger-zone billing change and a footer link.

A good DoD scales by tier and usually covers:

- type-level correctness
- runtime assertions and boundary validation
- persistence constraints when relevant
- tests for happy path and violation path
- monitoring or alert expectations for production-critical behavior
- code review and verification gates
- version-control cleanliness

## TDD mode is contextual

Use TDD aggressively when the work is:

- logic-heavy
- state-machine-heavy
- algorithmic
- security-sensitive
- financially sensitive

Do not force test-first ceremony where the main work is pure wiring or layout. But still require verification.

## Task decomposition rules

Tasks should be:

- small enough to review
- atomic enough to verify
- independent where possible
- ordered by dependency, not by vibes

Practical rules:

- aim for slices a human can review in one sitting
- each task must have a concrete verification step
- avoid giant tasks whose only verifier is “looks good I guess”

## A good task has three parts

- **what** to build or change
- **why** it exists or what invariant it protects
- **how to verify** completion

Example shape:

- define domain type / state model
- implement core operation with explicit pre/postconditions
- add persistence constraint
- add property or invariant tests
- wire observability / alerts
- verify with tests, lint, build, and manual flow

## Distill, elicit, propagate

Three useful modes exist in any codebase, whether or not you use Allium explicitly:

- **elicit**: discover behavior from stakeholders
- **distill**: derive behavior from existing implementation
- **propagate**: derive tests and obligations from the behavioral model

Use them deliberately.

A healthy engineering system can move in all three directions.

## Output of discovery

The output of good discovery is not vague confidence.

It is:

- a scoped behavioral model
- a PRD or equivalent decision record
- explicit invariants
- explicit acceptance criteria
- a risk-tiered task plan
- a reviewable path to implementation

If you do not have those, you are not ready to code.

## Final rule

Do not let the implementation choose the product.

The code should realize the design.
The design should not be inferred accidentally from whatever code was easiest to write first.