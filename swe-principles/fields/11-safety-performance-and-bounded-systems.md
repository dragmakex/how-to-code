# Safety, Performance, and Bounded Systems

Use this guide when correctness, predictable latency, resource limits, or failure containment matter enough that ordinary application defaults are too loose. It adapts TigerStyle's safety-first posture without pretending that every application is TigerBeetle or every language is Zig.

Priority order:

1. safety
2. performance
3. developer experience

Simplicity is the method that reconciles the three. It is not permission to skip bounds, error handling, or proof.

## Choose the strictness deliberately

Apply the strongest rules to foundational, concurrent, storage, protocol, financial, embedded, and other high-consequence code. For ordinary application code, preserve the principles while adapting mechanics to the host runtime.

Examples:

- A fixed-capacity queue may be right in a database engine; an application service may instead use a configured maximum plus explicit backpressure.
- Static startup allocation may be right in a latency-critical process; a managed-runtime service may instead use bounded pools, request limits, and measured allocation budgets.
- Explicitly sized integers are essential for persisted and wire data; native index types may remain appropriate for local collection APIs when conversions are checked at the boundary.

Do not cargo-cult a systems rule where it makes the system less correct. Record adaptations and the reason for them.

## Bound everything that can grow or wait

Every loop, queue, batch, retry policy, message, allocation, file, recursion depth, request, and wait needs either:

- a finite bound enforced in code, or
- a named invariant explaining why it is intentionally unbounded and how progress is guaranteed.

Prefer explicit control flow. Replace recursion when input depth is not tightly bounded. Put timeouts and cancellation on external waits. Make overload policy visible: reject, shed, backpressure, spill, or degrade. Silent growth is not a policy.

Bounds should come from a capacity sketch, not a decorative constant. State what happens at the limit and test that path.

## Separate programmer errors from operating errors

Programmer errors violate invariants. Assert them and stop before corrupt state spreads.

Operating errors are expected possibilities: network loss, malformed input, full disks, unavailable dependencies, permission failures. Handle them as typed or explicit outcomes and preserve enough context to diagnose them.

Assertions are executable design documentation:

- check arguments, preconditions, postconditions, and state transitions
- assert both expected valid space and rejected invalid space
- split unrelated assertions so failures identify one property
- place paired checks at different boundaries when corruption could occur between them, such as before persistence and after loading
- assert relationships among constants and representation sizes at build time where the language allows it

Assertions do not replace validation at trust boundaries, error handling, tests, or a mental model.

## Keep control flow auditable

Use simple branches and positive conditions. Complex boolean expressions hide missing cases. Prefer a small decision function that owns branching and leaf functions that do straightforward work.

A useful shape is:

1. validate and normalize inputs
2. establish bounds and invariants
3. decide policy in one visible place
4. execute bounded work
5. verify the result
6. publish or persist it

Keep variables in the smallest useful scope. Calculate values near their use. Avoid aliases and duplicate mutable representations that can drift apart. Treat indexes, counts, sizes, offsets, durations, and rates as distinct concepts even when the language gives them the same primitive type.

Function-length limits are a review signal, not a game. If a function no longer fits in one view, split by invariant or phase. Do not create tiny helpers that merely scatter control flow.

## Design performance before optimizing code

Before implementation, sketch the four resources:

| Resource | Questions |
|---|---|
| Network | round trips, payload sizes, batching, failure latency |
| Disk | IOPS, sequential vs random access, fsyncs, recovery work |
| Memory | peak live set, allocation rate, cache behavior, fragmentation |
| CPU | algorithmic cost, branch predictability, serialization, copies |

Estimate both latency and bandwidth. Be roughly right early; profile later to correct the model.

Optimize the architecture first:

- batch work to amortize fixed costs
- separate control-plane decisions from data-plane throughput
- keep hot loops isolated and arguments simple
- avoid hidden allocation and redundant conversion in hot paths
- make work per tick, request, or batch predictable
- prefer one strong algorithmic improvement over many micro-optimizations

Performance changes need a representative benchmark or production-like trace. A benchmark without a stated workload can reward the wrong behavior.

## Make ownership and memory behavior obvious

For resource-sensitive code:

- establish ownership at construction
- pair acquisition and release visibly
- prefer stable storage when references must remain valid
- avoid copies of large or stateful values when the language can express borrowing or references
- initialize large structures in place when moving them is costly or unsafe
- zero padding and unused buffer regions before crossing trust or persistence boundaries
- keep allocation after initialization bounded and observable

Managed runtimes do not remove these obligations; they change the instruments. Track heap limits, pool sizes, retained objects, garbage-collection pauses, and per-request allocation instead.

## Name units and intent

Names should make invalid arithmetic look suspicious:

- `latency_ms_max`
- `batch_count`
- `payload_size_bytes`
- `item_index`
- `retry_count_max`

Put units and qualifiers in a consistent order. Avoid abbreviations that save keystrokes but erase meaning. Choose nouns and verbs that match domain language and remain clear in logs, docs, and review.

At call sites, pass safety-relevant options explicitly instead of depending on library defaults that may change. This includes timeouts, durability, overwrite behavior, permissions, cache policy, and retry limits.

## Control dependency and tool risk

Each dependency and tool expands the supply chain, failure modes, update work, and operational knowledge required. Prefer the standard library, existing repository tools, or a small implementation when they are genuinely sufficient.

Do not turn "zero dependencies" into a universal slogan. For most products, a mature cryptography, database, protocol, or validation library is safer than a local rewrite. The rule is to justify dependencies against safety, performance, maintenance, and provenance—not to maximize or minimize a count blindly.

Pin and verify build inputs where reproducibility or supply-chain integrity matters. Keep the toolchain small enough that the team can operate it under failure.

## Verification gate

Before shipping high-consequence code, verify:

- every growth path and wait has a bound or explicit progress invariant
- overflow, underflow, truncation, rounding, and off-by-one cases are tested
- positive and negative input spaces are covered
- programmer errors assert; operating errors are handled
- error paths are exercised, not merely read
- resource estimates are written down and compared with measurements
- hot-path benchmarks use representative workloads
- strict compiler and linter warnings are enabled
- dependencies and defaults are deliberate
- comments explain why surprising constraints exist

The target is code whose failure modes fit in a reviewer's head before production teaches them the hard way.
