import { describe, expect, it, vi } from "vitest"

vi.mock("./grouped-todo-board", () => ({
  GroupedTodoBoard: () => null,
}))

describe("TodoList", () => {
  it("exports TodoList component", async () => {
    const { TodoList } = await import("./todo-list")
    expect(TodoList).toBeDefined()
    expect(typeof TodoList).toBe("function")
  })
})
