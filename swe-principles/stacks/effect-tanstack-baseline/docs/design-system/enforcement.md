# Design System Enforcement

## Intent

The design system is enforced at three levels:

1. **Type system** — components don't expose `className`, so violations are compile errors.
2. **Registry** — every file under `src/design-system/` must be registered with a justification.
3. **Linter** — blocks `className`, `style`, and styled native controls in application code.

## Commands

```bash
bun run lint:design-system
bun run lint:design-system:staged
bun run lint:design-system:changed
```

## What is enforced

### Structural (type system)

Design-system components do not accept `className`.
Application code cannot pass arbitrary CSS classes because the type signature forbids it.

### Component registry

Every file under `src/design-system/` must appear in `src/design-system/registry.ts`.
The registry entry includes a justification.

This prevents quietly adding thin wrapper components.
Before registering, apply the decision framework in `docs/design-system/rules.md`.

The linter checks the registry automatically — unregistered files fail the build.

### Application code linter

The linter blocks:

- `className=` usage in scoped application files
- `style=` usage in scoped application files
- Route-local styled native form controls

### Scope

Application enforcement targets:

- `src/routes/**`
- `src/component/**`

Registry enforcement targets:

- `src/design-system/**`

## Pre-commit

The pre-commit hook runs staged design-system lint so violations fail before a commit is recorded.

## CI

CI reruns the contract so drift cannot merge through inconsistent local environments.

## Exception policy

Allowed exceptions must include a reason marker on the same line as the violation or the immediately preceding line:

```tsx
// ds-exception: reason
```

Any exception without a reason is treated as a violation.
