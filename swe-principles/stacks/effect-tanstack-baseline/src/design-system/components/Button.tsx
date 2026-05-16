import { cx } from "@/design-system/foundation/classes"
import type { ButtonHTMLAttributes, ReactNode } from "react"

const baseClass =
  "inline-flex items-center justify-center gap-xs min-h-11 px-m border border-transparent rounded-md text-[0.95rem] font-semibold cursor-pointer transition-all duration-160 ease-in-out hover:not-disabled:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2"

const variantClass = {
  primary: "bg-accent-solid text-white",
  secondary: "border-border-default bg-bg-surface text-text-primary",
  ghost: "bg-transparent text-text-secondary",
  danger: "bg-danger-solid text-white",
} as const

type ButtonProps =
  & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">
  & {
    readonly children: ReactNode
    readonly variant?: keyof typeof variantClass | undefined
    readonly loading?: boolean | undefined
  }

/**
 * Renders a semantic application button.
 *
 * @param props - Button props.
 * @param props.children - Button label content.
 * @param props.disabled - Whether the button is disabled.
 * @param props.loading - Whether to show the busy state.
 * @param props.type - Button type attribute.
 * @param props.variant - Semantic visual variant.
 * @returns A styled button element.
 */
export function Button(
  {
    children,
    disabled,
    loading = false,
    type = "button",
    variant = "primary",
    ...props
  }: ButtonProps,
) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      className={cx(baseClass, variantClass[variant])}
    >
      {loading ? "Working…" : children}
    </button>
  )
}
