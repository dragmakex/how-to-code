import type { ReactNode } from "react"

const toneClass = {
  default: "border border-border-default rounded-lg bg-bg-surface shadow-sm",
  subtle: "border border-border-default rounded-lg bg-bg-subtle shadow-sm",
  accent: "border border-accent-wash rounded-lg bg-bg-accent shadow-sm",
  danger: "border border-border-danger rounded-lg bg-bg-danger shadow-sm",
} as const

type SurfaceProps = {
  readonly children: ReactNode
  readonly tone?: keyof typeof toneClass | undefined
  readonly as?: "div" | "section" | undefined
}

/**
 * Semantic surface container for grouped content.
 *
 * Renders as `<section>` — the browser's element for thematically
 * grouped content with a heading.
 *
 * @param props - Surface props.
 * @param props.children - Surface content.
 * @param props.tone - Surface tone role.
 * @param props.as - Underlying semantic container.
 * @returns A semantic container with visual surface treatment.
 */
export function Surface(
  { as = "section", children, tone = "default" }: SurfaceProps,
) {
  const Component = as

  return (
    <Component className={toneClass[tone]}>
      {children}
    </Component>
  )
}
