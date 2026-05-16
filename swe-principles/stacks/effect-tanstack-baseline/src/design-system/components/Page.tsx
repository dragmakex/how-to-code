import type { ReactNode } from "react"

type PageProps = {
  readonly children: ReactNode
}

/**
 * Full-page application wrapper with centered, constrained content.
 *
 * Renders as `<main>` — the browser's primary content landmark.
 *
 * @param props - Page props.
 * @param props.children - Page content.
 * @returns A semantic page wrapper.
 */
export function Page({ children }: PageProps) {
  return (
    <main className="min-h-screen bg-bg-canvas">
      <div className="mx-auto max-w-[80rem] px-l py-2xl">
        {children}
      </div>
    </main>
  )
}
