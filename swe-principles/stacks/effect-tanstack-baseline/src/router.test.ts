import { describe, expect, it, vi } from "vitest"

/**
 * Tests for router.tsx - Router configuration.
 *
 * We test exports without relying on router internal types.
 */

// Mock the route tree
vi.mock("./routeTree.gen", () => ({
  routeTree: { _tag: "RouteTree" },
}))

// Mock @tanstack/react-router to avoid runtime dependencies
vi.mock("@tanstack/react-router", () => ({
  createRouter: vi.fn((config) => ({
    routeTree: config.routeTree,
    scrollRestoration: config.scrollRestoration,
    defaultPreloadStaleTime: config.defaultPreloadStaleTime,
  })),
}))

describe("router", () => {
  it("exports getRouter function", async () => {
    const { getRouter } = await import("./router")
    expect(getRouter).toBeDefined()
    expect(typeof getRouter).toBe("function")
  })

  it("getRouter returns a router instance", async () => {
    const { getRouter } = await import("./router")
    const router = getRouter()
    expect(router).toBeDefined()
  })

  it("creates a new router on each call", async () => {
    const { getRouter } = await import("./router")
    const router1 = getRouter()
    const router2 = getRouter()
    // Each call should create a new instance
    expect(router1).not.toBe(router2)
  })
})
