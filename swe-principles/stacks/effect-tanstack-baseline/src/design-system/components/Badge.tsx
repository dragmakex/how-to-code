import { cx } from "@/design-system/foundation/classes"
import type { ReactNode } from "react"

const badgeBaseClass =
  "inline-flex items-center justify-center min-w-7 min-h-6 px-xs border rounded-full text-[0.8rem] font-bold text-text-primary"

const toneClass = {
  neutral: "border-border-default bg-bg-surface",
  accent: "border-accent-wash bg-bg-accent",
  success: "border-success-wash bg-bg-success",
  danger: "border-danger-wash bg-bg-danger",
} as const

type BadgeProps = {
  readonly children: ReactNode
  readonly tone?: keyof typeof toneClass | undefined
}

/**
 * Renders a compact semantic badge.
 *
 * @param props - Badge props.
 * @param props.children - Badge content.
 * @param props.tone - Badge tone role.
 * @returns A badge element.
 */
export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span className={cx(badgeBaseClass, toneClass[tone])}>
      {children}
    </span>
  )
}
