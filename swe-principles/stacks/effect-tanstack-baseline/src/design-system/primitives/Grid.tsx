import type { FormHTMLAttributes, ReactNode } from "react"

const layoutClass = {
  stats: "grid gap-m grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]",
  dashboard:
    "grid gap-l grid-cols-1 min-[960px]:grid-cols-[minmax(0,1.8fr)_minmax(18rem,0.9fr)]",
  form:
    "grid gap-m grid-cols-1 min-[880px]:grid-cols-[minmax(0,1.8fr)_minmax(10rem,1fr)_auto]",
} as const

type GridDivProps = {
  readonly children: ReactNode
  readonly layout: keyof typeof layoutClass
  readonly as?: "div" | undefined
}

type GridFormProps =
  & Omit<FormHTMLAttributes<HTMLFormElement>, "className">
  & {
    readonly children: ReactNode
    readonly layout: keyof typeof layoutClass
    readonly as: "form"
  }

type GridProps = GridDivProps | GridFormProps

/**
 * Responsive grid layout with named presets.
 *
 * @param props - Grid props.
 * @param props.children - Grid children.
 * @param props.layout - Named grid layout preset.
 * @param props.as - Underlying HTML element.
 * @returns A responsive grid container.
 */
export function Grid(props: GridProps) {
  if (props.as === "form") {
    const { as: _as, children, layout, ...formProps } = props

    return (
      <form {...formProps} className={layoutClass[layout]}>
        {children}
      </form>
    )
  }

  const { children, layout } = props

  return (
    <div className={layoutClass[layout]}>
      {children}
    </div>
  )
}
