/**
 * Pattern: Pure Projection
 * Purpose: Unit tests for date parsing and formatting utilities
 * See: docs/architecture/effect-simple-made-easy-mapping.md
 */

import { TodoDate } from "@/api/todo-schema"
import { expect, it } from "@effect/vitest"
import * as Schema from "effect/Schema"
import { formatTodoDate, parseTodoDateInput, todayTodoDate } from "./todo-date"

const decodeTodoDate = Schema.decodeSync(TodoDate)

it("parseTodoDateInput returns null for empty string", () => {
  expect(parseTodoDateInput("")).toBeNull()
  expect(parseTodoDateInput("   ")).toBeNull()
})

it("parseTodoDateInput parses valid dates", () => {
  expect(parseTodoDateInput("2026-04-01")).toBe("2026-04-01")
  expect(parseTodoDateInput("2026-12-31")).toBe("2026-12-31")
  expect(parseTodoDateInput("  2026-04-01  ")).toBe("2026-04-01")
})

it("parseTodoDateInput throws for invalid dates", () => {
  expect(() => parseTodoDateInput("invalid")).toThrow()
  expect(() => parseTodoDateInput("2026-13-01")).toThrow()
  expect(() => parseTodoDateInput("2026-04-32")).toThrow()
  expect(() => parseTodoDateInput("04-01-2026")).toThrow()
})

it("formatTodoDate formats dates for display", () => {
  const date = decodeTodoDate("2026-04-01")
  const formatted = formatTodoDate(date)

  // Should include the day, month, and year
  expect(formatted).toContain("1")
  expect(formatted).toContain("2026")
})

it("formatTodoDate handles leap years correctly", () => {
  const leapYearDate = decodeTodoDate("2024-02-29")
  const formatted = formatTodoDate(leapYearDate)

  expect(formatted).toContain("29")
  expect(formatted).toContain("2024")
})

it("formatTodoDate uses UTC timezone", () => {
  // This test ensures no local timezone issues affect formatting
  const date = decodeTodoDate("2026-06-15")
  const formatted = formatTodoDate(date)

  // Should format as June 15, not shifted by timezone offset
  expect(formatted).toContain("15")
  expect(formatted).toContain("2026")
})

it("todayTodoDate returns current UTC date in correct format", () => {
  const today = todayTodoDate()

  // Should match YYYY-MM-DD pattern
  expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)

  // Should be a valid TodoDate
  expect(() => decodeTodoDate(today)).not.toThrow()
})

it("round-trip: parse and format preserve date correctly", () => {
  const original = "2026-08-15"
  const parsed = parseTodoDateInput(original)

  expect(parsed).toBe(original)

  if (parsed !== null) {
    const formatted = formatTodoDate(parsed)
    // Formatting should include the original date components
    expect(formatted).toContain("15")
    expect(formatted).toContain("2026")
  }
})

it("parseTodoDateInput handles boundary dates", () => {
  // Year boundaries
  expect(parseTodoDateInput("2026-01-01")).toBe("2026-01-01")
  expect(parseTodoDateInput("2026-12-31")).toBe("2026-12-31")

  // Leap year
  expect(parseTodoDateInput("2024-02-29")).toBe("2024-02-29")

  // Century leap year (not divisible by 400)
  expect(() => parseTodoDateInput("1900-02-29")).toThrow()

  // 400-year leap year
  expect(parseTodoDateInput("2000-02-29")).toBe("2000-02-29")
})

it("handles millennium transition 1999-2001", () => {
  // Millennium boundary - 1999-12-31
  expect(parseTodoDateInput("1999-12-31")).toBe("1999-12-31")

  // Y2K - 2000-01-01 (first day of new millennium)
  expect(parseTodoDateInput("2000-01-01")).toBe("2000-01-01")

  // 2000 is a leap year (divisible by 400)
  expect(parseTodoDateInput("2000-02-29")).toBe("2000-02-29")
  expect(parseTodoDateInput("2000-12-31")).toBe("2000-12-31")

  // 2001-01-01 (first non-leap-year of millennium)
  expect(parseTodoDateInput("2001-01-01")).toBe("2001-01-01")
  expect(() => parseTodoDateInput("2001-02-29")).toThrow()
})

it("handles 2100 century leap year rules correctly", () => {
  // 2100 is NOT a leap year (divisible by 100 but not 400)
  // February should only have 28 days
  expect(parseTodoDateInput("2100-02-28")).toBe("2100-02-28")
  expect(() => parseTodoDateInput("2100-02-29")).toThrow()

  // Year boundaries around 2100
  expect(parseTodoDateInput("2099-12-31")).toBe("2099-12-31")
  expect(parseTodoDateInput("2100-01-01")).toBe("2100-01-01")
  expect(parseTodoDateInput("2100-12-31")).toBe("2100-12-31")
  expect(parseTodoDateInput("2101-01-01")).toBe("2101-01-01")
})

it("handles 2400 leap year (next 400-year cycle)", () => {
  // 2400 IS a leap year (divisible by 400)
  expect(parseTodoDateInput("2400-02-29")).toBe("2400-02-29")

  // Year boundaries
  expect(parseTodoDateInput("2399-12-31")).toBe("2399-12-31")
  expect(parseTodoDateInput("2400-01-01")).toBe("2400-01-01")
})
