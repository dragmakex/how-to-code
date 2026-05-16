# Security and Audit Readiness

Security work is not just “run a scanner”.

A strong workflow makes the system legible before the first deep audit pass starts.

This field covers:

- threat modeling
- entry-point review
- invariant synthesis
- targeted review loops
- audit-readiness reporting

## Start with an x-ray, not a guess

Before a serious review, generate a compact understanding of the system:

- what the system is
- what the trust boundaries are
- which entry points mutate state
- which actors can call them
- which invariants appear to protect the system
- which test gaps remain
- which parts of the history are hottest or riskiest

This is the generalized lesson from `x-ray`: auditors should not have to reverse-engineer the map from scratch every time.

## Minimum security map

A good pre-audit map usually includes:

- system overview
- actor table
- trust assumptions
- access-control model
- entry-point inventory
- permissionless vs role-gated vs admin-only operations
- major state machines
- invariants and assumptions
- integration points
- test maturity and gaps
- git hotspots and late risky changes

## Enumerate state-changing entry points

For any meaningful system, know the state-changing entry points.

For each one, record:

- name
- actor or caller class
- access level
- parameters with trust assumptions
- downstream calls
- state modified
- value or data flow direction
- reentrancy / concurrency / idempotency / duplication concerns where relevant

This is useful far beyond smart contracts.

It applies to:

- HTTP handlers
- RPC methods
- CLI commands
- cron jobs
- queue consumers
- webhooks
- admin scripts

## Use multiple review lenses

One pass is not enough.

Review from several angles, for example:

- input validation and boundary hygiene
- authorization and capability misuse
- math / precision / units
- concurrency and reentrancy style failures
- state machine or lifecycle violations
- economic or incentive abuse
- integration trust assumptions
- operational and monitoring blind spots

This generalizes the strongest part of `solidity-auditor`: parallel specialized reviewers often see different bugs.

## Smaller scopes often produce better review

A highly scoped review on the hot 2–5 modules being changed is often better than a shallow “whole repo” pass.

Use whole-repo x-rays for orientation.
Use targeted slices for high-signal review.

## Repeat passes when the stakes are real

Security review output is non-deterministic even when humans are involved.

Do another pass when:

- the code is high-risk
- a lot changed
- the first pass was broad and shallow
- an invariant feels weak but not yet disproven

A single clean review pass is not proof of safety.

## Invariants are security material

Security review should explicitly surface:

- conservation invariants
- authorization invariants
- monotonicity invariants
- one-time transition invariants
- bounded-value invariants
- cross-system trust assumptions
- operational invariants like “only one active X per Y”

If an invariant exists only in somebody’s head, it is not yet protecting the system.

## Test gaps are part of the security report

A review should identify not just bugs, but blind spots.

Examples:

- no property tests for critical math
- no invariant tests for state machines
- no integration tests for trust boundaries
- no alerting for impossible production states
- no test for failure-mode behavior under dependency outage

A system can be insecure because the review surface is too dark.

## Git history matters

Review the change surface, not just the current files.

Look for:

- hot files with repeated security fixes
- large last-minute changes in dangerous areas
- forked dependencies drifting from upstream
- high-risk code changed without nearby tests
- ownership concentration in critical modules

History is not proof, but it is strong review guidance.

## Threat model shape

A usable threat model usually answers:

- who are the actors?
- which actors are trusted, semi-trusted, or untrusted?
- what assets matter?
- what value or authority can be extracted or redirected?
- what actions are irreversible?
- what assumptions exist about time, ordering, pricing, or external systems?

Keep it concrete.

## Security work must end in action

A report without concrete next steps is theater.

Good action items say:

- what is wrong or weak
- why it matters
- what to change
- how to verify the fix
- what monitoring should exist after the fix

## Final rule

Security readiness means the system is understood well enough that:

- the risky entry points are known
- the invariants are named
- the trust boundaries are explicit
- the blind spots are visible
- the fixes are concrete

You do not need false certainty.
You need legibility and disciplined reduction of unknowns.