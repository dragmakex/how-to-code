import { Surface } from "@/design-system/primitives/Surface"
import type { ReactNode } from "react"

type CardProps = {
  readonly children: ReactNode
  readonly tone?: "default" | "subtle" | "accent" | "danger" | undefined
}

/**
 * Renders a padded semantic card surface.
 *
 * @param props - Card props.
 * @param props.children - Card content.
 * @param props.tone - Surface tone role.
 * @returns A card wrapper.
 */
export function Card({ children, tone = "default" }: CardProps) {
  return (
    <Surface tone={tone}>
      <div className="p-l">
        {children}
      </div>
    </Surface>
  )
}
