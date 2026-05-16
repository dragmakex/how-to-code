import { describe, expect, it, vi } from "vitest"

/**
 * Tests for __root.tsx - Root document layout route.
 *
 * We test basic exports.
 */

// Mock the CSS import
vi.mock("../styles.css?url", () => ({
  default: "/styles.css",
}))

// Mock @effect/atom-react
vi.mock("@effect/atom-react", () => ({
  RegistryProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock TanStack devtools
vi.mock("@tanstack/react-devtools", () => ({
  TanStackDevtools: () => null,
}))

// Mock TanStack router
vi.mock("@tanstack/react-router", () => ({
  createRootRoute: vi.fn((config) => config),
  HeadContent: () => null,
  Scripts: () => null,
}))

// Mock TanStack router devtools
vi.mock("@tanstack/react-router-devtools", () => ({
  TanStackRouterDevtoolsPanel: () => null,
}))

describe("__root route", () => {
  it("exports Route", async () => {
    const { Route } = await import("./__root")
    expect(Route).toBeDefined()
  })

  it("Route is configured correctly", async () => {
    const { Route } = await import("./__root")
    // Route is the object returned by createRootRoute
    expect(Route).toHaveProperty("head")
    expect(Route).toHaveProperty("shellComponent")
  })
})
