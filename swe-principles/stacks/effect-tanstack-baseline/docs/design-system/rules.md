# Design System Rules

## Intent

These rules are the hard policy for UI work.
Violations are build failures, not style preferences.

## Enforcement model

**Components are the boundary.**

Design-system primitives and components expose typed props.
They do not expose `className`.
Application code composes them — it does not style anything.

Tailwind CSS is an internal tool of the design-system layer.
Application code never touches Tailwind utilities directly.

## Should this be a component?

Before adding anything to `src/design-system/`, apply this decision framework.
Every new file must be registered in `src/design-system/registry.ts` with a justification.
The linter enforces this — unregistered files fail the build.

### It IS a component when

- It **replaces a native HTML control** that app code would otherwise style directly
  (`Button`, `TextField`, `Checkbox`).
- It **encapsulates a non-trivial visual contract** with multiple variants, states, or
  internal structure that must stay consistent (`Tabs`, `Badge`, `StatCard`).
- It is a **required state pattern** that every data surface must implement
  (`EmptyState`, `ErrorState`).
- It is a **layout primitive** that cannot be expressed by composing existing primitives
  (`Grid` with named responsive presets, `Expand` for flex-grow).

### It is NOT a component when

- It is **a div with one className string**. That is composition, not a component.
  Use `Stack`, `Inline`, or `Grid` with the right props.
- It is **a synonym for an existing primitive with a fixed prop**.
  `<Stack gap="l">` is not `<SidebarStack>`.
  `<Inline align="between">` is not `<GroupHeader>`.
- It is **app-specific layout** that only one route uses.
  Keep it as inline composition in the route.
- It **has no variants, no internal logic, no props beyond `children`**.
  That means it has no decision surface — it is just indirection.

### The test

Ask: "If I delete this component and replace every usage with its implementation
inlined, does anything get harder to maintain?"

If no, it should not exist.

## Required rules

### 1. Compose, do not wrap

Use existing primitives (`Stack`, `Inline`, `Grid`, `Expand`) and components
to build layouts. Do not create thin wrapper components for layout patterns.

### 2. Register before adding

Every file under `src/design-system/` must appear in `src/design-system/registry.ts`.
The registry entry must include a justification that passes the decision framework above.
The linter enforces this automatically.

### 3. Use design-system components for semantic UI

For interactive and semantic elements, use components from `src/design-system/**`:

- `Button` instead of a styled `<button>`
- `TextField` instead of a styled `<input>`
- `Card`, `Badge`, `Tabs`, `EmptyState`, `ErrorState` for surfaces and patterns

### 4. No className in application code

Application code must not use the `className` attribute.
All visual styling flows through design-system component props.

### 5. No inline style in application code

Application code must not use the `style` attribute.

### 6. No route-local styled native controls

Do not style native `<button>`, `<input>`, `<select>`, or `<textarea>` in app code.
Use design-system wrappers.

### 7. Routes compose; design-system styles

Route and feature components compose structure and data flow.
Visual implementation belongs in the design-system layer.

## Exceptions

Exceptions are allowed only when:

1. The design-system cannot reasonably support the use case yet.
2. The exception is local and explicit.
3. The exception includes a reason.

```tsx
// ds-exception: third-party widget requires inline width measurement
```

Silent bypasses are not allowed.
Exceptions without a reason are treated as violations.
