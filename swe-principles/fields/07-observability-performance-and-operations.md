# Observability, Performance, and Operations

If the system runs in production, correctness does not stop at tests.

This field covers:

- health and readiness
- logs, traces, metrics, profiles, errors, analytics
- local-first observability setups
- performance budgets
- operational verification

## Observability is part of the definition of done

A production-meaningful feature is not finished until operators can answer:

- is it broken?
- where is it broken?
- why is it broken?
- who or what is affected?
- can we correlate the failure across systems?

## The observability stack model

A useful default model is:

- **logs** → what happened
- **traces** → where time and causality flowed
- **spans** → what operation is being timed
- **metrics** → how often and how badly
- **profiles** → why it is slow at code level
- **error tracking** → rich failure context and release correlation
- **analytics** → user-visible impact and workflow fallout

These are strongest when they correlate by default.

## Traces show where, spans show what, profiles show why

This is an excellent operational mental model.

Use it.

- trace: which services or boundaries participated?
- span: which operation within that path was slow or failed?
- profile: which code path or resource hotspot explains the span cost?

## Health and readiness are contracts

Provide explicit endpoints or checks for:

- liveness / health
- readiness / dependency readiness
- critical subsystem availability

Do not conflate “process exists” with “system is ready to serve”.

## Structured logs, not console despair

Logs for serious systems should be:

- structured
- correlated
- queryable
- severity-aware
- deliberate about sensitive data

Useful fields often include:

- request or correlation ID
- trace ID / span ID
- actor or tenant identifiers where appropriate
- operation name
- duration
- error class or taxonomy

## Error taxonomy matters

Not all failures are the same.

A good system distinguishes between:

- validation errors
- domain rule violations
- dependency failures
- infrastructure failures
- unexpected bugs / invariant violations

This helps:

- alerts
- dashboards
- SLO analysis
- postmortems
- user-facing error mapping

## Verify telemetry end-to-end

Do not stop at “we initialized the SDK”.

Verify that:

- traces actually arrive
- logs are queryable
- alerts can trigger
- health and readiness reflect real dependency state
- errors show up in the right sink
- performance data can be correlated back to code

Instrumentation that is wired but unverified is decorative.

## Local-first production mirrors are valuable

When possible, keep a local observability stack that mirrors production concerns.

Benefits:

- validate wiring before deploy
- test incident workflows
- verify dashboards and alerts locally
- debug correlation issues without cloud dependency

The principle matters even if the exact tooling differs from LAOS.

## Performance is a managed budget

Define explicit budgets.

Examples:

- p95 latency
- bundle size
- cold-start size or time
- query duration
- retry ceilings
- memory footprint

Then automate checks for them where practical.

Do not talk about performance as a mood.
Measure it.

## Distinguish user cost from server cost

Not all performance numbers matter equally.

Examples:

- frontend payload size hits every user
- server bundle size may only matter at startup
- a DB query in a hot path matters more than a background job once per day

Choose the budget that matches the real cost surface.

## Operational verification checklist

For production-significant work, verify:

- health endpoint behavior
- readiness endpoint behavior
- error-path observability
- trace/span creation on important operations
- log correlation fields
- alert hooks or TODOs for missing alert infrastructure
- performance checks if the hot path changed

## Incident-response friendliness

Ask of the system:

- can a responder trace the failure across layers?
- can they identify the failing invariant?
- can they distinguish code bug from dependency failure?
- can they see whether users were affected?

If not, the system is harder to operate than it needs to be.

## Production defense is the final guarantee layer

Monitoring exists because:

- tests are finite
- types are incomplete
- runtime checks can be bypassed or miswired
- persistence constraints cannot express every property

Treat monitoring as a real correctness layer, not a bolt-on afterthought.

## Final rule

A production-ready system is observable enough that:

- failures are seen quickly
- bottlenecks are explainable
- operators can move from symptom to root cause
- the team can prove whether the change improved or worsened the system

That is operational quality.