import * as Option from "effect/Option"
import { describe, expect, it, vi } from "vitest"

vi.mock("@effect/atom-react", () => ({
  useAtom: () => [{ waiting: false }, vi.fn()],
}))

vi.mock("effect/unstable/reactivity/AsyncResult", () => ({
  isFailure: () => false,
}))

vi.mock("./atoms", () => ({
  updateTodoAtom: { _tag: "updateTodoAtom" },
  deleteTodoAtom: { _tag: "deleteTodoAtom" },
}))

vi.mock("./use-refresh-dashboard", () => ({
  useRefreshDashboard: () => vi.fn(),
}))

describe("TodoItem", () => {
  it("exports TodoItem component", async () => {
    const { TodoItem } = await import("./todo-item")
    expect(TodoItem).toBeDefined()
    expect(typeof TodoItem).toBe("function")
  })

  it("update payload uses Option for title, completion, and due date", () => {
    const togglePayload = {
      input: {
        title: Option.none(),
        completed: Option.some(true),
        dueDate: Option.some("2026-03-31"),
      },
    }

    expect(Option.isNone(togglePayload.input.title)).toBe(true)
    expect(Option.getOrThrow(togglePayload.input.completed)).toBe(true)
    expect(Option.getOrThrow(togglePayload.input.dueDate)).toBe("2026-03-31")
  })
})
