import { TodoDate, type TodoDate as TodoDateType } from "@/api/todo-schema"
import * as Schema from "effect/Schema"

const decodeTodoDate = Schema.decodeUnknownSync(TodoDate)

/**
 * Converts an HTML date input value into a todo date or null.
 *
 * @param value - Raw date input value.
 * @returns A todo date or null when empty.
 */
export function parseTodoDateInput(value: string): TodoDateType | null {
  const trimmed = value.trim()

  if (trimmed === "") {
    return null
  }

  return decodeTodoDate(trimmed)
}

/**
 * Formats a todo date for presentation.
 *
 * @param date - The todo date.
 * @returns A localized display label.
 */
export function formatTodoDate(date: TodoDateType): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

/**
 * Produces the current UTC day in the todo date format.
 *
 * @returns The current UTC date string.
 */
export function todayTodoDate(): TodoDateType {
  const now = new Date()
  const yyyy = String(now.getUTCFullYear())
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(now.getUTCDate()).padStart(2, "0")
  return decodeTodoDate(`${yyyy}-${mm}-${dd}`)
}
