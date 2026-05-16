# State, Data, and Guarantees

State design is where software quality becomes real or imaginary.

This field covers:

- durable facts vs derived views
- state modeling
- provenance
- invariants
- guarantee hierarchies
- how to scale correctness effort by risk

## Durable facts first

Persist what actually happened.
Derive the views later.

Good durable facts are:

- appendable or reconstructable
- explicitly identified
- provenance-aware
- boring to store
- rich enough to rebuild higher-level meaning

Derived views can then answer:

- current state
- grouped summaries
- timelines
- status totals
- current context projections
- audit trails

Do not store every convenience view as primary truth.

## Public data models should speak domain

Use the host language’s strongest honest mechanism for domain cases:

- enums / tagged unions / sealed hierarchies
- branded or validated value types
- state-parameterized types where helpful
- records/structs/classes that encode the domain, not the ORM accident

Avoid anemic `type + payload` sludge when the cases are meaningful.

## Provenance is part of the model

If data came from somewhere important, say where it came from.

Useful provenance fields:

- source system
- path / location
- scope / tenant / workspace
- import origin
- time chosen or observed
- actor identity or system identity

This makes diagnostics explainable and migrations survivable.

## Canonical state vs projection state

The rule:

- one canonical state source
- many projections
- explicit refresh / recomputation policy

Projection state is read-only derived meaning.

If your app keeps several mutable “truths” for the same domain, you are building contradiction engines.

## Guarantees are layered

No single layer is enough.

Use a guarantee hierarchy.

## Layer 1 — Types

Goal: make invalid states harder or impossible to represent.

Examples:

- validated IDs
- non-empty strings
- positive amounts
- explicit error types
- state-encoded domain entities
- exhaustive matching

Types catch categories of mistakes cheaply. They do not prove the full system.

## Layer 2 — Runtime validation and assertions

Goal: catch violations at boundaries and critical transitions.

Examples:

- input decoding / validation
- preconditions
- postconditions
- smart constructors
- protocol assertions
- explicit failure modes

Runtime checks are where the system says: “this may compile, but it is still invalid”.

## Layer 3 — Persistence constraints

Goal: stop invalid durable state even if application code is wrong.

Examples:

- unique constraints
- foreign keys
- check constraints
- partial unique indexes
- triggers for complex invariants
- append-only event-store protections

For critical state, the database is not just storage. It is a defense layer.

## Layer 4 — Tests

Goal: verify behavior, not just structure.

Examples:

- unit tests
- invariant tests
- property-based tests
- integration tests
- state-machine tests
- constraint verification tests
- architecture tests

Tests cover what types and constraints cannot fully express.

## Layer 5 — Monitoring and production defense

Goal: catch violations that escaped the earlier layers.

Examples:

- invariant-violation alerts
- anomaly detection
- structured error reporting
- health and readiness endpoints
- request correlation IDs
- trace and log correlation

If a production-critical invariant can fail silently, the system is unfinished.

## Choose rigor by criticality

| Tier | Typical domain | Minimum stance |
| --- | --- | --- |
| T1 | money, auth, signing, irreversible state | all guarantee layers, explicit monitoring, simulation thinking |
| T2 | user data, business rules, state machines | strong types/runtime/persistence/tests/monitoring |
| T3 | standard feature work | strong types or validation + tests |
| T4 | low-risk support work | lightweight guarantees, still explicit |

## Invariants must be named

Name the property you are protecting.

Examples:

- `NO_DOUBLE_CHARGE`
- `CANCELED_NEVER_CHARGED`
- `PERIOD_ADVANCES_ON_SUCCESS`
- `ACTIVE_RECORDS_HAVE_REQUIRED_OWNER`
- `ONE_ACTIVE_DEPLOYMENT_PER_ENVIRONMENT`

This helps:

- code review
- tests
- alerts
- docs
- postmortems

Unnamed invariants become folklore.

## Common invariant shapes

- conservation
- uniqueness
- monotonic progression
- bounded values
- allowed transitions only
- exactly-once or at-most-once behavior
- actor authorization constraints
- referential integrity
- temporal ordering
- causality across subsystems

## Boundaries are where validation belongs

Dynamic or external data should be normalized at the boundary.

Do not let loose values leak inward.

Examples:

- API input
- webhook payloads
- files and config
- browser events
- third-party SDK responses
- database row materialization

A strict boundary is cheaper than contaminated internals.

## State machines deserve first-class treatment

If an entity has meaningful lifecycle states:

- model them explicitly
- define allowed transitions
- define forbidden transitions
- define terminal states
- define what must hold in each state

Do not spread lifecycle assumptions across random booleans and nullable fields.

## Guard vs invariant

A guard is a per-call precondition.
An invariant is a property that must hold across any valid sequence of calls.

Examples:

- guard: “amount must be positive for this request”
- invariant: “persisted balances are never negative”

Both matter. They are not the same thing.

## Auditability matters

For serious systems, ask:

- can we reconstruct what happened?
- can we explain why this state exists?
- can we identify who or what caused it?
- can we prove an invariant was protected or violated?

If no, the data model is not yet operationally complete.

## Final rule

A system is trustworthy when:

- its facts are explicit
- its views are derivable
- its invariants are named
- its guarantees are layered
- its failures are observable

Everything else is optimism.