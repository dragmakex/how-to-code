# Design System

## Intent

This design system is a **contract** for application UI work in this repository.
It is not optional guidance.

The enforcement model is simple: **components are the boundary**.
Application code composes design-system primitives and components with typed props.
It never uses `className`, `style`, or raw HTML elements with styling.

Tailwind CSS is an internal implementation detail of the design-system layer.
Application code does not touch it.

## When implementing or changing UI

1. Read the design-system docs in this directory.
2. Inspect the source of truth under `src/design-system/**`.
3. Compose from primitives and components — do not create thin wrappers.
4. Run `bun run lint:design-system` to verify the contract.

## Document map

- `docs/design-system/rules.md` — hard DO / NEVER policy
- `docs/design-system/tokens.md` — semantic visual language and token roles
- `docs/design-system/patterns.md` — composition patterns (read this first for UI work)
- `docs/design-system/enforcement.md` — local, staged, and CI enforcement contract

## Inventory

### Primitives (layout building blocks)

| Component | Purpose                                                           |
| --------- | ----------------------------------------------------------------- |
| `Stack`   | Vertical flex with semantic gap                                   |
| `Inline`  | Horizontal flex with semantic gap, alignment, wrap                |
| `Grid`    | Named responsive grid layouts (`stats`, `dashboard`, `form`)      |
| `Expand`  | Flex-grow child container                                         |
| `Surface` | Semantic background with border and shadow, as `div` or `section` |

### Components (semantic UI)

| Component    | Purpose                                                     |
| ------------ | ----------------------------------------------------------- |
| `Page`       | Full-page wrapper with content constraints                  |
| `Card`       | Padded surface for content sections                         |
| `Button`     | Semantic action button with variants                        |
| `Heading`    | Typography: page, display, section, card                    |
| `Text`       | Typography: body, muted, label, caption, danger + alignment |
| `Badge`      | Compact status indicator                                    |
| `TextField`  | Labeled input with hint/error                               |
| `Checkbox`   | Labeled checkbox with hint                                  |
| `Tabs`       | Tab list with counts                                        |
| `PageHeader` | Page title with description and actions                     |
| `StatCard`   | Dashboard summary metric                                    |
| `EmptyState` | Empty data surface                                          |
| `ErrorState` | Error recovery surface                                      |

### Composition, not wrappers

Common layouts like sidebar stacks, group headers, action rows, and todo lists
are expressed by composing primitives (`Stack`, `Inline`, `Expand`).
See `docs/design-system/patterns.md` for examples.

**Do not create single-use wrapper components for layout patterns.**

### Component registry

Every file under `src/design-system/` must be registered in `src/design-system/registry.ts`
with a justification. The linter enforces this — unregistered files fail the build.

Before adding a new component, apply the decision framework in `docs/design-system/rules.md`.

## Source of truth

- `src/design-system/foundation/**` — utility functions and token maps
- `src/design-system/primitives/**` — layout primitives
- `src/design-system/components/**` — semantic UI components
- `src/styles.css` — Tailwind `@theme` tokens and base resets

## Architecture

```
┌─────────────────────────────────────────────┐
│  Application code (routes, features)        │
│  Composes DS primitives + components        │
│  No className, no style, no raw elements    │
├─────────────────────────────────────────────┤
│  Design-system components + primitives      │
│  Typed props → Tailwind utilities internally│
│  Nothing exposes className                  │
├─────────────────────────────────────────────┤
│  Tailwind CSS + @theme tokens               │
│  Semantic values: bg-bg-surface, gap-m, etc │
│  Only used inside src/design-system/**      │
├─────────────────────────────────────────────┤
│  styles.css                                 │
│  @theme block, base resets, dark mode       │
└─────────────────────────────────────────────┘
```

## Scope

The design-system contract applies to product UI in:

- `src/routes/**`
- `src/component/**`

Design-system internals under `src/design-system/**` use Tailwind utilities freely.
Application code outside that layer must not.
