import { cx } from "@/design-system/foundation/classes"
import { spaceClass, type SpaceToken } from "@/design-system/foundation/tokens"
import type { ReactNode } from "react"

const alignClass = {
  center: "items-center",
  start: "items-start",
  between: "items-center justify-between",
} as const

type InlineProps = {
  readonly children: ReactNode
  readonly gap?: SpaceToken | undefined
  readonly align?: keyof typeof alignClass | undefined
  readonly wrap?: boolean | undefined
}

/**
 * Arranges children horizontally with semantic spacing tokens.
 *
 * @param props - Layout props.
 * @param props.children - Elements to arrange horizontally.
 * @param props.gap - Semantic gap token.
 * @param props.align - Alignment behavior.
 * @param props.wrap - Whether items may wrap.
 * @returns A horizontal layout wrapper.
 */
export function Inline(
  { align = "center", children, gap = "s", wrap = false }: InlineProps,
) {
  return (
    <div
      className={cx(
        "flex",
        wrap ? "flex-wrap" : "flex-nowrap",
        spaceClass[gap],
        alignClass[align],
      )}
    >
      {children}
    </div>
  )
}
