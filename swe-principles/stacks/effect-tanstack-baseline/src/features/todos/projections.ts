/**
 * Pattern: Pure Projection Functions
 * Purpose: Derive read-models from plain data without effects, I/O, or frameworks
 * See: docs/architecture/template-simple-crud.md
 */

import type {
  Todo,
  TodoDashboardSnapshot,
  TodoDate,
  TodoGroup,
  TodoGroupKey,
  TodoStats,
} from "@/api/todo-schema"
import * as DateTime from "effect/DateTime"

const compareTodoDates = (
  left: TodoDate | null,
  right: TodoDate | null,
): number => {
  if (left === right) {
    return 0
  }

  if (left === null) {
    return 1
  }

  if (right === null) {
    return -1
  }

  return left.localeCompare(right)
}

/**
 * Sort todos for dashboard presentation.
 *
 * @param left - Left todo.
 * @param right - Right todo.
 * @returns A sort order compatible with Array.prototype.sort.
 */
export const compareTodos = (left: Todo, right: Todo): number => {
  const completedOrder = Number(left.completed) - Number(right.completed)
  if (completedOrder !== 0) {
    return completedOrder
  }

  const dueDateOrder = compareTodoDates(left.dueDate, right.dueDate)
  if (dueDateOrder !== 0) {
    return dueDateOrder
  }

  if (left.updatedAt.epochMilliseconds !== right.updatedAt.epochMilliseconds) {
    return left.updatedAt.epochMilliseconds - right.updatedAt.epochMilliseconds
  }

  return left.id.localeCompare(right.id)
}

/**
 * Convert a UTC DateTime into the repository's calendar-day type.
 *
 * @param now - Current UTC time.
 * @returns The current UTC date in YYYY-MM-DD form.
 */
export const todoDateFromDateTime = (now: DateTime.DateTime): TodoDate => {
  const date = DateTime.toDateUtc(now)
  const yyyy = String(date.getUTCFullYear())
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(date.getUTCDate()).padStart(2, "0")

  return `${yyyy}-${mm}-${dd}` as TodoDate
}

/**
 * Classify a todo into a dashboard bucket.
 *
 * @param todo - Todo to classify.
 * @param today - Current UTC day.
 * @returns The dashboard group key.
 */
export const classifyTodo = (
  todo: Todo,
  today: TodoDate,
): TodoGroupKey => {
  if (todo.completed) {
    return "completed"
  }

  if (todo.dueDate === null) {
    return "unscheduled"
  }

  if (todo.dueDate < today) {
    return "overdue"
  }

  if (todo.dueDate === today) {
    return "today"
  }

  return "upcoming"
}

/**
 * Derive dashboard statistics from a todo list.
 *
 * @param todos - Todos to summarize.
 * @param today - Current UTC day.
 * @returns Aggregate dashboard statistics.
 */
export const deriveTodoStats = (
  todos: ReadonlyArray<Todo>,
  today: TodoDate,
): TodoStats =>
  todos.reduce<TodoStats>(
    (stats, todo) => {
      const classification = classifyTodo(todo, today)

      return {
        total: stats.total + 1,
        active: stats.active + (todo.completed ? 0 : 1),
        completed: stats.completed + (classification === "completed" ? 1 : 0),
        overdue: stats.overdue + (classification === "overdue" ? 1 : 0),
        dueToday: stats.dueToday + (classification === "today" ? 1 : 0),
        upcoming: stats.upcoming + (classification === "upcoming" ? 1 : 0),
        unscheduled: stats.unscheduled
          + (classification === "unscheduled" ? 1 : 0),
      }
    },
    {
      total: 0,
      active: 0,
      completed: 0,
      overdue: 0,
      dueToday: 0,
      upcoming: 0,
      unscheduled: 0,
    },
  )

/**
 * Group todos into dashboard buckets.
 *
 * @param todos - Todos to group.
 * @param today - Current UTC day.
 * @returns Grouped dashboard buckets.
 */
export const deriveTodoGroups = (
  todos: ReadonlyArray<Todo>,
  today: TodoDate,
): ReadonlyArray<TodoGroup> => {
  const buckets: Record<TodoGroupKey, Array<Todo>> = {
    overdue: [],
    today: [],
    upcoming: [],
    unscheduled: [],
    completed: [],
  }

  for (const todo of [...todos].sort(compareTodos)) {
    buckets[classifyTodo(todo, today)].push(todo)
  }

  const definitions: ReadonlyArray<{
    readonly key: TodoGroupKey
    readonly label: string
  }> = [
    { key: "overdue", label: "Overdue" },
    { key: "today", label: "Due today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "unscheduled", label: "Unscheduled" },
    { key: "completed", label: "Completed" },
  ]

  return definitions.map(({ key, label }) => ({
    key,
    label,
    count: buckets[key].length,
    todos: buckets[key],
  }))
}

/**
 * Build the complete dashboard read model from canonical todos.
 *
 * @param todos - Canonical todo list.
 * @param today - Current UTC day.
 * @returns Snapshot consumed by HTTP, RPC, and UI layers.
 */
export const deriveTodoDashboardSnapshot = (
  todos: ReadonlyArray<Todo>,
  today: TodoDate,
): TodoDashboardSnapshot => {
  const orderedTodos = [...todos].sort(compareTodos)

  return {
    todos: orderedTodos,
    stats: deriveTodoStats(orderedTodos, today),
    groups: deriveTodoGroups(orderedTodos, today),
  }
}
