import { spaceClass, type SpaceToken } from "@/design-system/foundation/tokens"
import type { ReactNode } from "react"

const alignClass = {
  stretch: "items-stretch",
  start: "items-start",
  center: "items-center",
} as const

type StackProps = {
  readonly children: ReactNode
  readonly gap?: SpaceToken | undefined
  readonly align?: keyof typeof alignClass | undefined
}

/**
 * Arranges children vertically with semantic spacing tokens.
 *
 * @param props - Layout props.
 * @param props.children - Elements to stack vertically.
 * @param props.gap - Semantic gap token.
 * @param props.align - Cross-axis alignment.
 * @returns A vertical layout wrapper.
 */
export function Stack({ align = "stretch", children, gap = "m" }: StackProps) {
  return (
    <div className={`flex flex-col ${spaceClass[gap]} ${alignClass[align]}`}>
      {children}
    </div>
  )
}
