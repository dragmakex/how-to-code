# Effect Mapping For Simple Made Easy

## Intent

Effect already provides the base fundamentals needed to build a simpler CRUD
template. The main work is not inventing more abstractions. The main work is
mapping architectural concerns onto the right Effect primitives and then
stopping there.

## Mapping table

| Architectural concern            | Preferred Effect primitive              | Template use                                 |
| -------------------------------- | --------------------------------------- | -------------------------------------------- |
| current time at runtime          | `Clock`                                 | choose time in application modules           |
| already-chosen timestamp         | plain data argument                     | pass into helpers and projections            |
| randomness / identity            | small service such as `TodoIdGenerator` | isolate ambient randomness                   |
| effectful use-case orchestration | `Effect.gen` in application modules     | compose repositories, clocks, events         |
| runtime wiring                   | `Layer`                                 | choose live, test, or seeded implementations |
| infrastructure capability        | `ServiceMap.Service` or tagged service  | repositories, event sinks, clients           |
| pure derivation                  | plain function                          | projections and domain rules                 |
| async replication growth path    | event sink service                      | outbox, queues, projectors later             |

## What to use where

### Routes and server functions

Use:

- request decoding,
- authorization,
- delegation to application effects,
- response shaping,
- SSR dehydration.

Avoid:

- long orchestration chains,
- domain branching,
- persistence details,
- direct randomness or helper-local time reads.

### Feature application modules

Use:

- `Effect.gen` to orchestrate,
- `Clock` to choose current time,
- repository services,
- event sinks,
- pure projection functions.

Avoid:

- transport-specific imports,
- React imports,
- database table definitions,
- UI concerns.

### Projections and pure domain helpers

Use:

- plain functions,
- immutable inputs and outputs,
- schema-backed data types,
- deterministic derivation.

Avoid:

- ambient time,
- ambient randomness,
- direct I/O,
- framework imports.

### Repositories and adapters

Use:

- translation between persisted rows and feature data,
- adapter-specific bootstrapping,
- explicit infrastructure wiring.

Avoid:

- business classification policy,
- route semantics,
- mutation fanout,
- hidden identity policy.

## Larger applications

This mapping is not todo-specific.
It generalizes to any bigger CRUD system built from this template.

### Example

An invoice feature should map like this:

- `application.ts` — issue invoice, record payment, void invoice
- `projections.ts` — aging buckets, overdue totals, customer balances
- `events.ts` — `InvoiceIssued`, `PaymentRecorded`, `InvoiceVoided`
- `adapters/` — SQL repository, HTTP handlers, RPC handlers, queue projectors

The same pattern applies to orders, customers, workflows, and notifications.

## Non-goals

This mapping is intentionally practical.
It does not try to force:

- a universal ban on loops,
- a universal ban on classes,
- full event sourcing,
- queues everywhere from day one.

It instead chooses defaults that keep growth paths open while preserving simple
boundaries now.

## Related documents

- `docs/architecture/template-simple-crud.md`
- `docs/architecture/simple-made-easy.md`
- `docs/guides/code-quality.md`
