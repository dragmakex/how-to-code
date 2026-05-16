/**
 * Pattern: SSR Atom Hydration
 * Purpose: Hydrate serializable atoms from server payload into React registry
 * See: docs/architecture/overview.md (Data Flow section)
 */

"use client"

import { RegistryContext } from "@effect/atom-react"
import * as React from "react"
import type { DehydratedAtom } from "./atom-utils"

export type HydrationBoundaryProps = {
  readonly children: React.ReactNode
  readonly state?: Iterable<DehydratedAtom> | undefined
}

/**
 * Hydrates serializable atoms into the current registry before rendering children.
 *
 * @param props - Hydration boundary props.
 * @param props.children - Content to render after hydration.
 * @param props.state - Dehydrated atom payloads.
 * @returns The hydrated subtree.
 */
export const HydrationBoundary = (
  { children, state }: HydrationBoundaryProps,
) => {
  const registry = React.useContext(RegistryContext)

  React.useMemo(() => {
    if (!state) {
      return
    }

    for (const dehydratedAtom of state) {
      registry.setSerializable(dehydratedAtom.key, dehydratedAtom.value)
    }
  }, [registry, state])

  return (
    <>
      {children}
    </>
  )
}
