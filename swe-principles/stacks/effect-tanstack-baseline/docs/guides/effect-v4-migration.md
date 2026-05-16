# Effect v4 Migration Guide

This guide summarizes the Effect v4 beta migration guidance used in this repository. It is based on the migration docs in `effect-smol`.

## Core Changes

- Services: use `ServiceMap.Service` instead of `Context.Tag` / `Effect.Tag` / `Effect.Service`.
- Error handling: `Effect.catchAll` -> `Effect.catch`, `Effect.catchAllCause` -> `Effect.catchCause`.
- Yieldable: `Ref`, `Deferred`, `Fiber` are no longer Effect subtypes. Use `Ref.get`, `Deferred.await`, `Fiber.join`.
- Modules: `@effect/platform/*` and `@effect/rpc/*` are consolidated into `effect/unstable/http*` and `effect/unstable/rpc*`.
- Layer memoization now spans multiple `Effect.provide` calls. Prefer composing layers anyway.
- State: use `effect/unstable/reactivity` + `@effect/atom-react` instead of `@effect-atom/*`.

## Import Mapping

- `@effect/platform/Http*` -> `effect/unstable/http/*`
- `@effect/platform/HttpApi*` -> `effect/unstable/httpapi/*`
- `@effect/rpc/*` -> `effect/unstable/rpc/*`

## Service Pattern

- Define services with `ServiceMap.Service` and a `make` effect.
- Define layers explicitly with `Layer.effect` and `Layer.provide`.

## Notes

- Effect v4 beta uses `effect/unstable/*` modules for components that are still stabilizing.
- Keep migration changes minimal and explicit to reduce regressions.
