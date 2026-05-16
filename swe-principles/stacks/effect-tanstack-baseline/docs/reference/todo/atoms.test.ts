import { describe, expect, it, vi } from "vitest"

vi.mock("@/api/api-client", () => ({
  ApiClient: {
    Default: { _tag: "Layer" },
  },
}))

describe("atoms", () => {
  it("exports runtime and dashboard atoms", async () => {
    const { runtime, todoGroupsAtom, todosAtom, todoStatsAtom } = await import(
      "./atoms"
    )

    expect(runtime).toBeDefined()
    expect(todosAtom).toBeDefined()
    expect(todosAtom.remote).toBeDefined()
    expect(todoStatsAtom).toBeDefined()
    expect(todoStatsAtom.remote).toBeDefined()
    expect(todoGroupsAtom).toBeDefined()
    expect(todoGroupsAtom.remote).toBeDefined()
  })

  it("exports dashboard mutation atoms", async () => {
    const { createTodoAtom, deleteTodoAtom, updateTodoAtom } = await import(
      "./atoms"
    )

    expect(createTodoAtom).toBeDefined()
    expect(updateTodoAtom).toBeDefined()
    expect(deleteTodoAtom).toBeDefined()
  })
})
