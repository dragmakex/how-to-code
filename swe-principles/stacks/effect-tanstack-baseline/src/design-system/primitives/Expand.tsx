import type { ReactNode } from "react"

type ExpandProps = {
  readonly children: ReactNode
}

/**
 * Fills available flex space while preventing overflow.
 *
 * Use inside `Inline` or `Stack` when a child should grow to fill remaining space.
 *
 * @param props - Expand props.
 * @param props.children - Content that should expand.
 * @returns A flex-grow container.
 */
export function Expand({ children }: ExpandProps) {
  return (
    <div className="flex-1 min-w-0">
      {children}
    </div>
  )
}
