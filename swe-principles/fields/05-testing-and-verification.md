# Testing and Verification

Tests are not one thing.

A strong system uses several verification modes, each aimed at a different failure class.

## The testing ladder

Use a layered test model.

## 1. Unit tests

Verify a small behavior slice with small fixtures.

Use for:

- pure calculations
- small transformations
- error mapping
- deterministic policy branches
- state transition helpers

## 2. Property-based tests

Verify invariants across many generated inputs.

Use for:

- conservation
- idempotency
- commutativity where applicable
- determinism
- normalization rules
- ordering invariants
- state-machine exploration

Property tests are especially valuable when a bug can hide between hand-picked examples.

## 3. Integration tests

Verify that meaningful boundaries collaborate correctly.

Use for:

- API + application + persistence flows
- event publication and async processing
- repository behavior against real DB constraints
- multi-component workflows

## 4. Component / UI tests

Verify user-facing semantics, not implementation trivia.

Use:

- semantic queries
- accessibility roles and labels
- real interaction flows
- loading, empty, success, and error states

## 5. Visual regression tests

Use when visual stability is part of the product contract.

Test:

- critical components
- high-value states
- responsive layouts
- cross-browser regressions when the stack warrants it

## 6. Architecture tests

Verify boundary rules mechanically.

Examples:

- forbidden imports
- no heavyweight dependency on root import path
- no UI-layer DB coupling
- no hidden time/randomness in pure modules
- no design-system bypass

## 7. Constraint verification tests

If the system relies on persistence constraints, test that the constraints actually exist and reject bad state.

Do not assume the migration is correct because it looked plausible in review.

## Test behavior, not implementation

A good test says:

- given meaningful domain facts
- when a real behavior occurs
- then an observable property holds

A bad test says:

- I called five internal helper functions
- and now the private data shape looks like my current implementation

That test locks the implementation without protecting the behavior.

## Name the invariant

For important tests, name what they protect.

Examples:

- `NO_DOUBLE_CHARGE`
- `CANCELED_NEVER_CHARGED`
- `SETTER_DOES_NOT_BYPASS_CAP`
- `TERMINAL_STATE_HAS_NO_OUTBOUND_TRANSITIONS`

This makes the suite readable as a correctness map.

## Time must be controllable

Never build time-sensitive tests around sleeping and hope.

Use:

- fake clocks
- injected time providers
- adjustable schedulers
- explicit timestamps chosen at the application boundary

If the system cannot test time without racing the wall clock, improve the architecture first.

## Test data must be isolated

Prefer:

- seeded fixtures
- test factories
- in-memory or disposable databases when appropriate
- explicit cleanup or scoped resource management

Avoid:

- shared mutable integration environments as the only verifier
- magical fixture soup no one can explain

## Failure paths matter

Every important behavior needs both:

- success verification
- violation-path verification

If you only test the happy path, you do not know how the system behaves under pressure.

## Coverage is a signal, not the truth

Coverage thresholds are useful when treated honestly.

They do not prove correctness.
They do expose neglected areas.

Use them as a gate, but not as your only source of confidence.

Practical stance:

- raise coverage where the risk is high
- do not celebrate coverage while invariants remain untested
- do not tighten thresholds before adding the tests to support them

## Test UI states as a full contract

Major UI surfaces usually require all of:

- loading
- empty
- success
- recoverable error
- retry behavior
- keyboard or accessibility behavior where relevant

A screen without state coverage is only partially tested.

## Verify the stack-specific claims too

If the architecture claims:

- lazy loading
- SSR hydration correctness
- performance budget compliance
- health endpoint correctness
- design-system enforcement
- browser compatibility

then tests or automated checks should exist for those claims.

## End-of-slice verification

Before handing over work, the verification chain should usually include:

- targeted lint
- targeted typecheck
- changed-area tests
- full suite or relevant gated subset
- build
- smoke test or manual flow for the changed behavior

For production-significant work, also include:

- observability verification
- health/readiness verification
- performance checks if affected
- security review if the change alters trust boundaries

## Final rule

A test suite is strong when it answers:

- what behavior matters?
- what invariants matter?
- what architecture promises matter?
- what failure modes matter?

If the suite cannot answer those, it is noise with badges.