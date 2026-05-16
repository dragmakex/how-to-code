import { describe, expect, it, vi } from "vitest"

vi.mock("./create-todo-form", () => ({
  CreateTodoForm: () => null,
}))

vi.mock("./dashboard-stats", () => ({
  DashboardStats: () => null,
}))

vi.mock("./grouped-todo-board", () => ({
  GroupedTodoBoard: () => null,
}))

vi.mock("./recent-activity", () => ({
  RecentActivity: () => null,
}))

describe("App", () => {
  it("exports App component", async () => {
    const { App } = await import("./app")
    expect(App).toBeDefined()
    expect(typeof App).toBe("function")
  })
})
