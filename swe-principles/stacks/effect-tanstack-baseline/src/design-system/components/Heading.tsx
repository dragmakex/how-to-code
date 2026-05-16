import type { HTMLAttributes, ReactNode } from "react"

const toneClass = {
  page:
    "m-0 text-text-primary text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.05]",
  display:
    "m-0 text-text-primary text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-[1.1]",
  section: "m-0 text-text-primary text-[1.125rem] font-[650] leading-[1.25]",
  card: "m-0 text-text-primary text-[1rem] font-[650] leading-[1.25]",
} as const

type HeadingProps =
  & Omit<HTMLAttributes<HTMLHeadingElement>, "className">
  & {
    readonly children: ReactNode
    readonly as?: "h1" | "h2" | "h3" | "h4" | undefined
    readonly tone?: keyof typeof toneClass | undefined
  }

/**
 * Renders semantic heading typography.
 *
 * @param props - Heading props.
 * @param props.as - Underlying heading element.
 * @param props.children - Heading content.
 * @param props.tone - Heading role.
 * @returns A semantic heading element.
 */
export function Heading(
  { as = "h2", children, tone = "section", ...props }: HeadingProps,
) {
  const Component = as
  return (
    <Component {...props} className={toneClass[tone]}>
      {children}
    </Component>
  )
}
