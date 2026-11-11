# Product Delivery and Repository Operations

Use this guide when a change spans product planning, repository setup, implementation, verification, documentation, and iteration. It generalizes the engineering practices in The Closed Loop Company (TCLC) skills. TCLC's specific vendors and stack defaults are examples, not universal prescriptions.

The core loop is:

> research → decide → build one slice → verify → adversarially review → record → resynchronize

## Start with durable decisions

Before scaffolding a new product or large subsystem, write down:

- the user and problem
- the evidence that the problem exists
- v1 scope and explicit non-goals
- a data-model sketch
- the principal risks
- open assumptions and questions
- meaningful technical decisions and their consequences

Use the smallest document set the project will maintain. A useful starting set is:

| Document | Durable fact it owns |
|---|---|
| `README.md` | human entry point, architecture, exact setup and verification commands |
| `AGENTS.md` or equivalent | short operating guide for coding agents and contributors |
| plan or brief | scope, non-goals, risks, unresolved decisions |
| roadmap | ordered milestones and accepted cuts |
| ADRs | consequential decisions and their history |
| changelog | shipped behavior, fixes, and required manual steps |
| runbooks | operational procedures that must work under pressure |

Do not create every file by ritual. Create a document only when it owns information that would otherwise be repeatedly re-derived or lost.

Accepted ADRs are historical records. Supersede them instead of rewriting the past. Label intentional simplifications so a future maintainer does not mistake a deliberate cut for an accidental omission.

## Scaffold guarantees, not decoration

A new repository should establish its minimum guarantees on day one:

- one toolchain and dependency workflow
- strict type or compiler settings appropriate to the language
- a clear source-of-truth package for shared contracts
- validated configuration at every executable boundary
- a committed example configuration without secrets
- CI that installs reproducibly, checks types or compilation, runs real tests, and builds production artifacts
- an ignore policy that protects secrets and generated output
- exact local setup and test commands

Choose technology for the product and team. House defaults are useful only when they reduce decision cost without violating the problem's constraints.

Build one thin vertical slice before parallelizing. Exercise the real path from input and domain model through persistence or service boundaries to the user-visible result. This exposes bad assumptions while they are cheap.

When work fans out, freeze shared contracts first and assign ownership of overlapping files. A contract change is complete only when all consumers are reconciled in the same change.

## Design testing in layers

Use three complementary layers where the product warrants them:

1. **Unit and integration tests** for domain behavior and real boundary integration.
2. **End-to-end tests** for critical journeys and wiring.
3. **Manual or exploratory QA** for user-facing behavior, hardware, accessibility, and interactions automation does not judge well.

Prefer real local services when the point of the test is integration behavior. Use fakes for deterministic failure injection, expensive providers, or boundaries whose contract—not implementation—is under test. A blanket "never mock" or "mock everything" rule hides the actual purpose of the test.

Keep test ownership clear. Separate framework discovery patterns so unit and end-to-end runners do not accidentally collect each other's files.

CI should include the production build. Development servers compile lazily and can miss route, bundling, environment, or tree-shaking failures.

Never use no-op test or typecheck scripts to make a workspace look green. If a check is absent, report the gap explicitly.

For user-facing changes, verification includes exercising the affected flow in a real browser, simulator, device, or equivalent environment. Verify durable outcomes at the source of truth, not only the rendered UI.

## Fix bugs from evidence

A bug that cannot be reproduced is still a hypothesis. Before editing:

1. capture an executable reproduction, trace, or exact failing input
2. classify the failure as contract, implementation, or environment
3. locate the first layer where behavior diverges from the intended invariant
4. fix that layer rather than stacking a downstream patch
5. turn the reproduction into a regression test
6. run neighboring and full relevant checks

Environment failures deserve first-class suspicion: stale build output, shadowed variables, expired credentials, wrong ports, and incompatible local services often masquerade as code defects.

If the broken approach is unsalvageable, revert it and record why. Reverting is a successful correction, not a failure to preserve sunk cost.

For error paths, degrade visibly. Preserve user data where possible, log or record the failure, and surface the degraded mode. An empty `catch` block is not resilience.

## Run adversarial review against executable claims

For meaningful or risky changes, review the changed surface through distinct lenses:

- correctness and invariants
- authorization and data exposure
- concurrency, retries, and idempotency
- wire formats and compatibility
- UI state and recovery
- operations and rollback

A plausible concern becomes a confirmed finding when it has an executable reproduction, failing test, trace, or concrete invariant violation. This filters speculative churn while still rewarding aggressive investigation.

Fix confirmed findings with regression coverage. Record rejected findings and the reason when the decision is important; otherwise the same debate returns without new evidence.

Periodically review the whole system rather than only diffs. Local correctness can coexist with a decaying architecture.

## Keep repository memory synchronized

Documentation changes in the same commit as the behavior it describes. When code renames or removes a flow, search the README, agent guide, examples, runbooks, and end-to-end tests for stale references.

Keep facts in the right owner:

- code and schemas own implemented behavior
- plans and ADRs own intent and decisions
- runbooks own operational procedures
- changelogs own shipped history
- worklogs, when useful, own investigation context and lessons

Do not duplicate the same instructions across files. Point to the source of truth.

A short "gotchas learned the hard way" section can act as a repository immune system. Add only recurring, non-obvious lessons; delete entries once the underlying hazard is removed.

## Automate repeatable operations

Separate human-only actions from automatable work.

Human-only actions include legal approval, payment consent, KYC, and account ownership decisions. If an operation has a stable API or CLI and repeats, prefer an idempotent script with:

- check or dry-run mode
- explicit scope
- validation before mutation
- safe retries
- clear output describing changes
- tests for planning and destructive boundaries

Publishing, provisioning, secret migration, deployment, and price changes are consequential. Inspect current state first and require deliberate apply semantics.

Store secrets in an approved secret manager or deployment platform, not in repositories or untracked files treated as permanent storage. Validate required secrets at process startup and avoid passing secrets through build artifacts or logs.

## Iterate in coherent units

A useful iteration has:

1. written scope and accepted cuts
2. implementation with tests
3. adversarial review
4. verification in the real execution environment
5. synchronized docs and changelog
6. one coherent commit or a small reviewable series

Track quality by durable evidence—coverage of critical behavior, escaped defects, build health, operational recovery—not by test count alone.

Dogfood real workflows. Preserve the exact input or sequence behind a miss so it can become a regression fixture. Periodically revisit product and market assumptions; research that never changes a decision is archival, not an iteration loop.

## Delivery gate

Before declaring a product change done, check:

- scope and non-goals remain honest
- shared contracts and all consumers agree
- configuration fails early and readably
- tests cover the new behavior and important failure path
- CI builds the production artifact
- affected user flows were exercised in a real environment when applicable
- errors remain visible and user data is preserved
- docs, examples, runbooks, and changelog match the implementation
- manual steps are truly human-only
- the commit explains the decision or root cause clearly

The repository should let the next person continue from durable facts instead of reconstructing the team's memory from chat and git archaeology.
