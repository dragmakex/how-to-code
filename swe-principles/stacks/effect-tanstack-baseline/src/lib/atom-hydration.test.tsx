import { RegistryContext } from "@effect/atom-react"
import * as Schema from "effect/Schema"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import { expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"
import { HydrationBoundary } from "./atom-hydration"
import { type DehydratedAtom, serializable } from "./atom-utils"

/**
 * Tests for atom-hydration.tsx - ensures dehydrated atoms are queued and applied.
 */

test("HydrationBoundary hydrates serializable atoms through the registry", async () => {
  const registry = AtomRegistry.make()
  const setSerializable = vi.spyOn(registry, "setSerializable")
  const existingAtom = Atom.make({ count: 0 }).pipe(
    serializable({
      key: "existing-key",
      schema: Schema.Struct({ count: Schema.Number }),
    }),
  )

  const state: Array<DehydratedAtom> = [
    {
      "~@effect-atom/atom/DehydratedAtom": true,
      key: "existing-key",
      value: existingAtom[Atom.SerializableTypeId].encode({ count: 1 }),
      dehydratedAt: 1,
    },
    {
      "~@effect-atom/atom/DehydratedAtom": true,
      key: "new-key",
      value: { count: 2 },
      dehydratedAt: 2,
    },
  ]

  await render(
    <RegistryContext.Provider value={registry}>
      <HydrationBoundary state={state}>
        <div data-testid="hydration-child" />
      </HydrationBoundary>
    </RegistryContext.Provider>,
  )

  await new Promise((resolve) => setTimeout(resolve, 0))

  expect(setSerializable).toHaveBeenCalledWith("new-key", { count: 2 })
  expect(setSerializable).toHaveBeenCalledWith(
    "existing-key",
    existingAtom[Atom.SerializableTypeId].encode({ count: 1 }),
  )
  expect(setSerializable).toHaveBeenCalledTimes(2)
  expect(registry.get(existingAtom)).toEqual({ count: 1 })
})

test("HydrationBoundary skips when state is undefined", async () => {
  const registry = AtomRegistry.make()
  const setSerializable = vi.spyOn(registry, "setSerializable")

  await render(
    <RegistryContext.Provider value={registry}>
      <HydrationBoundary>
        <div data-testid="hydration-empty" />
      </HydrationBoundary>
    </RegistryContext.Provider>,
  )

  await new Promise((resolve) => setTimeout(resolve, 0))

  expect(setSerializable).not.toHaveBeenCalled()
})

test("HydrationBoundary does not mutate unrelated atoms", async () => {
  const registry = AtomRegistry.make()
  const setSerializable = vi.spyOn(registry, "setSerializable")
  const unrelatedAtom = Atom.make({ count: 0 }).pipe(
    serializable({
      key: "unrelated-key",
      schema: Schema.Struct({ count: Schema.Number }),
    }),
  )

  const state: Array<DehydratedAtom> = [
    {
      "~@effect-atom/atom/DehydratedAtom": true,
      key: "plain-key",
      value: { count: 1 },
      dehydratedAt: 1,
    },
  ]

  await render(
    <RegistryContext.Provider value={registry}>
      <HydrationBoundary state={state}>
        <div data-testid="hydration-unrelated" />
      </HydrationBoundary>
    </RegistryContext.Provider>,
  )

  await new Promise((resolve) => setTimeout(resolve, 0))

  expect(setSerializable).toHaveBeenCalledWith("plain-key", { count: 1 })
  expect(registry.get(unrelatedAtom)).toEqual({ count: 0 })
})
