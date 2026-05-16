# LAOS Observability Overlay

Use this overlay when your development or CI workflow uses a local observability stack similar to LAOS:

- Grafana
- Loki
- Tempo
- Prometheus
- Pyroscope
- Sentry
- PostHog

This is not a generic observability essay.
This is the concrete overlay for a local-first, correlated observability environment.

## What LAOS gives you

A single mental model:

- traces
- logs
- metrics
- profiles
- errors
- analytics

all correlated by default.

That makes it possible to move from symptom to root cause without glue-code archaeology.

## What to wire in your app

At minimum:

- server-side structured logs
- server-side tracing / spans
- server-side error reporting
- health and readiness endpoints
- client-side error reporting where relevant
- client-side analytics where relevant
- profiling when the runtime supports it

## Operating model

Use this correlation model:

- trace = where the request or workflow went
- span = what operation within that flow mattered
- log = what happened at each boundary
- profile = why the hot code path is slow
- error tracker = rich failure context
- analytics = who or what user workflows were affected

## Verification sequence

After wiring, verify end-to-end:

1. generate real traffic
2. confirm traces exist
3. confirm logs exist
4. confirm errors are captured
5. confirm health/readiness behave correctly
6. confirm spans exist around meaningful service boundaries
7. confirm profiles appear when profiling is enabled
8. confirm you can correlate the same event across systems

## App wiring rules

- runtime configuration should be explicit
- observability layers must be provided to the actual server runtime, not just instantiated nearby
- tracing without meaningful spans is incomplete
- console logs alone are not an observability story
- a configured DSN or endpoint is not proof of a working integration

## When to use this overlay

Use this when:

- you want local-first observability parity
- you want to validate telemetry before cloud deployment
- you want trace/log/profile correlation during development
- you want to debug performance and failure modes without remote dependency

## When not to overfit to it

Do not force the LAOS tooling names onto a system that uses different vendors.

Carry forward the principles:

- correlation by default
- local verification
- explicit runtime wiring
- end-to-end smoke checks
- observability as part of done

The tooling may change.
The operational discipline should not.