# Architecture and Boundaries

Architecture is the control of entanglement.

The universal goal is simple:

- keep policy separate from transport
- keep state separate from presentation
- keep external weirdness separate from the domain core
- make lifecycle boundaries explicit

## Small core, extensible edge

The core should own:

- invariants
- durable facts
- domain operations
- lifecycle rules

The edges should own:

- integrations
- transport protocols
- user-interface frameworks
- plugin systems
- environment-specific startup and shutdown

Do not keep promoting useful workflows into the core just because they are convenient. The core must stay small enough to fit in a human head.

## Default feature shape

A portable feature split looks like this:

```text
feature/
  application      # orchestration and use-cases
  projections      # pure derivation and read models
  events           # domain events / async boundary
  adapters         # persistence, RPC, HTTP, jobs, external systems
```

The exact filenames differ by language and repo. The roles do not.

## Responsibility split

### Routes / controllers / handlers
Own:

- request decoding
- auth at the boundary
- delegation
- response shaping
- SSR dehydration or equivalent boundary tasks

Avoid:

- deep orchestration
- persistence policy
- business-rule branching sludge

### Application modules
Own:

- use-case orchestration
- dependency composition at the use-case level
- current time selection
- event publication
- repository coordination
- calling pure projections

Avoid:

- UI imports
- request/transport shapes
- direct low-level framework leakage

### Projections / pure domain helpers
Own:

- sorting
- grouping
- classification
- summary derivation
- read models
- pure domain calculations

Avoid:

- I/O
- hidden time
- hidden randomness
- framework imports
- direct persistence coupling

### Adapters
Own:

- databases
- queues
- HTTP or RPC transport
- filesystem boundaries
- external APIs
- browser or OS quirks

Avoid:

- becoming the home of business policy
- inventing new domain rules in the adapter layer

## Lifecycle boundaries must be named

If something must be rebuilt when the environment changes, say so in the architecture.

Examples of lifecycle boundaries:

- workspace / tenant changes
- auth identity changes
- selected project or document changes
- provider/runtime changes
- UI mode changes
- server restart / request scope / job scope
- plugin reloads

A good architecture makes startup, replacement, and teardown explicit.

## Time, randomness, and identity must be explicit

Do not let time and randomness leak from ambient globals into the core.

Prefer:

- injected clock or chosen timestamp
- explicit ID generation boundary
- named identity service where IDs matter
- test seams for time-sensitive logic

If a piece of code cannot be tested without sleeping or mocking global time, the architecture is incomplete.

## One canonical state model

For any nontrivial UI or workflow system:

- one canonical state source
- many derived views
- one mutation path per concern

Do not maintain the same truth in several abstractions at once.

Examples of bad state ownership:

- raw list in one store
- filtered list in another
- stats in a third
- optimistic patches in a fourth

That is drift waiting to happen.

## Derived views are projections

Views should be rebuilt from the canonical model.

This applies to:

- UI dashboard stats
- grouped lists
- status counts
- search indexes
- summarized records
- context windows and replay views

Persist facts. Derive read models.

## Pattern discovery before implementation

Before introducing a new pattern:

1. search the repo for the canonical local example
2. identify the existing boundary rule
3. explain what invariant the pattern protects
4. only then extend it

Do not invent a new manager, registry, service, or wrapper because the noun sounds architecturally important.

If you cannot justify the pattern from a real boundary problem, do not add it.

## Adapter isolation

External systems are weird.

Quarantine that weirdness in adapters:

- provider quirks
- browser quirks
- OS behavior
- DB driver oddities
- network retry semantics
- cloud-specific constraints

The domain layer should not know or care which specific brand of weirdness produced a value.

## Extension points must be narrow and revocable

A good extension point gives explicit powers:

- register command
- register renderer
- register event handler
- register tool
- register schema

A bad extension point is “have the whole runtime and good luck”.

When contexts reload or runtime boundaries change, stale handles should fail loudly.

## Keep dependency direction obvious

Lower layers do not import higher ones.

The dependency ladder should be boring:

- core/domain knows least
- adapters know outside systems
- presentation knows rendering
- application composes the lower layers

If the module tree makes illegal architecture feel natural, the module tree is wrong.

## Architecture is verified, not merely described

Use lint rules, tests, and code review to enforce the boundary model.

Examples of high-signal enforcement:

- no DB imports in UI
- no hidden time in pure modules
- no hidden randomness in domain helpers
- no route-level orchestration sludge
- no design-system bypasses in application UI

The architecture is real only when violation is costly.

## Final rule

When in doubt, separate:

- policy from mechanism
- facts from views
- domain from transport
- core from adapter
- lifecycle from incidental convenience

That is where maintainability comes from.