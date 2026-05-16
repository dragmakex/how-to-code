/**
 * Design system component registry.
 *
 * Every primitive and component in the design system must be registered here
 * with a justification for its existence. The design-system linter verifies
 * that no unregistered files exist under `src/design-system/`.
 *
 * Before adding a new entry, apply the decision framework in
 * `docs/design-system/rules.md` § "Should this be a component?".
 *
 * @see docs/design-system/rules.md
 */
export const registry = {
  foundation: {
    "foundation/classes.ts":
      "cx() class joiner — shared utility for DS internals",
    "foundation/tokens.ts":
      "Typed spacing scale mapping to Tailwind @theme classes",
  },

  primitives: {
    "primitives/Stack.tsx":
      "Vertical flex layout — core building block for all vertical composition",
    "primitives/Inline.tsx":
      "Horizontal flex layout — core building block for all horizontal composition",
    "primitives/Grid.tsx":
      "Named responsive grid layouts — cannot be expressed by Stack/Inline",
    "primitives/Expand.tsx":
      "Flex-grow child — enables fluid layouts inside Inline/Stack",
    "primitives/Surface.tsx":
      "Semantic background/border/shadow — visual tone system",
  },

  components: {
    "components/Page.tsx":
      "Full-page wrapper — page-level constraints used by every route",
    "components/Card.tsx":
      "Padded surface — used everywhere for content sections",
    "components/Button.tsx":
      "Interactive control — replaces all native buttons in app code",
    "components/Heading.tsx":
      "Semantic typography — three heading roles (page/section/card)",
    "components/Text.tsx":
      "Semantic typography — five text roles (body/muted/label/caption/danger)",
    "components/Badge.tsx": "Compact status indicator — semantic tone system",
    "components/TextField.tsx":
      "Labeled input — replaces all native text inputs in app code",
    "components/Checkbox.tsx":
      "Labeled checkbox — replaces all native checkboxes in app code",
    "components/Tabs.tsx": "Tab list — interactive segmented view with counts",
    "components/PageHeader.tsx":
      "Composed pattern — title + description + actions, used by every page",
    "components/StatCard.tsx":
      "Composed pattern — dashboard metric card with label/value/helper",
    "components/EmptyState.tsx":
      "State pattern — required for every data surface",
    "components/ErrorState.tsx":
      "State pattern — required for every data surface",
  },
} as const

/**
 * All registered file paths relative to `src/design-system/`.
 */
export const registeredPaths: ReadonlyArray<string> = [
  ...Object.keys(registry.foundation),
  ...Object.keys(registry.primitives),
  ...Object.keys(registry.components),
  "registry.ts",
]
