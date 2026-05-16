# Stack References

Use stack references when your technology choice materially changes implementation shape.

General rule:

- read the `fields/` guides first
- then read the matching stack reference here
- if no stack matches closely, stay with the general guides and translate the principles into your stack

## Available stack material

## `effect-tanstack-baseline/`

Direct working-tree copy of the baseline stack repository built around:

- Effect
- TanStack Start
- React
- Bun
- Drizzle
- structured testing and observability

Use this when your system looks close to:

- typed frontend + backend monorepo
- effect-oriented application architecture
- RPC or route-based typed boundaries
- strong CI validation + observability integration

## `effect-tanstack-solid.md`

Delta guide for the Solid version of the same architecture family.

Use this when your stack is closer to:

- Solid 2.0
- `@effect/atom-solid`
- SSR + atom hydration
- stricter design-system enforcement at the UI boundary

## `laos-observability.md`

Overlay guide for a local-first correlated observability environment.

Use this when your team runs a stack resembling:

- Grafana
- Loki
- Tempo
- Prometheus
- Pyroscope
- Sentry
- PostHog

## `rust-best-practices.md`

Rust overlay derived from Apollo GraphQL's Rust best-practices material.

Use this when your stack is closer to:

- Rust libraries or services
- Cargo workspaces
- explicit ownership and borrowing discipline
- typed error handling and compile-time state modeling

## `solidity-pashov.md`

Solidity overlay derived from Pashov's `solidity-auditor` and `x-ray` skills.

Use this when your stack is closer to:

- Solidity / EVM protocols
- Foundry or Hardhat
- permissionless entry points with asset risk
- audit-readiness and adversarial review workflows

## Selection rule

If your stack is:

- **close match** → use the matching stack guide plus the general field guides
- **partial match** → steal patterns, not technology choices
- **different stack entirely** → use the general field guides only

Examples:

- Go service with PostgreSQL and OpenTelemetry → use general field guides, not the Effect/TanStack stack docs
- Rust Axum app with typed domain model and tracing → use the general field guides plus `rust-best-practices.md`
- Python Django app with Redis + Celery → use general field guides, especially boundaries, guarantees, testing, observability, and security
- Solidity protocol with Foundry → use the general field guides plus `solidity-pashov.md`
- Solid + Effect + TanStack app → use both the general field guides and `effect-tanstack-solid.md`

## Do not cargo-cult the stack

The purpose of stack references is to show one well-developed realization of the principles.

Do not copy:

- framework-specific ceremony your stack does not need
- naming that only makes sense in another runtime
- libraries that exist only to mimic a pattern your host language already provides

Copy:

- the boundary discipline
- the verification model
- the state-management posture
- the testing ladder
- the observability requirements
- the version-control rigor