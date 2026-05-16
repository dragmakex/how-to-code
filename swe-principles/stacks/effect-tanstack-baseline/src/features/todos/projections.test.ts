import type { Todo } from "@/api/todo-schema"
import { TodoDate, TodoId } from "@/api/todo-schema"
import { expect, it } from "@effect/vitest"
import * as DateTime from "effect/DateTime"
import * as Schema from "effect/Schema"
import {
  classifyTodo,
  deriveTodoDashboardSnapshot,
  todoDateFromDateTime,
} from "./projections"

const decodeTodoId = Schema.decodeSync(TodoId)
const decodeTodoDate = Schema.decodeSync(TodoDate)

const makeTodo = (
  partial: Partial<Todo> & Pick<Todo, "title" | "completed">,
): Todo => ({
  id: partial.id ?? decodeTodoId(`todo-${partial.title}`),
  title: partial.title,
  completed: partial.completed,
  dueDate: partial.dueDate ?? null,
  createdAt: partial.createdAt ?? DateTime.fromDateUnsafe(new Date()),
  updatedAt: partial.updatedAt ?? DateTime.fromDateUnsafe(new Date()),
})

it("converts DateTime values into TodoDate values", () => {
  const today = todoDateFromDateTime(
    DateTime.fromDateUnsafe(new Date(Date.UTC(2026, 3, 1))),
  )

  expect(today).toBe("2026-04-01")
})

it("classifies todos by due date and completion", () => {
  const today = decodeTodoDate("2026-04-01")

  expect(classifyTodo(makeTodo({ title: "Done", completed: true }), today))
    .toBe("completed")
  expect(
    classifyTodo(
      makeTodo({
        title: "Overdue",
        completed: false,
        dueDate: decodeTodoDate("2026-03-31"),
      }),
      today,
    ),
  )
    .toBe("overdue")
  expect(
    classifyTodo(
      makeTodo({
        title: "Today",
        completed: false,
        dueDate: today,
      }),
      today,
    ),
  )
    .toBe("today")
  expect(
    classifyTodo(
      makeTodo({
        title: "Later",
        completed: false,
        dueDate: decodeTodoDate("2026-04-03"),
      }),
      today,
    ),
  )
    .toBe("upcoming")
  expect(classifyTodo(makeTodo({ title: "Backlog", completed: false }), today))
    .toBe("unscheduled")
})

it("derives dashboard snapshots from canonical todos", () => {
  const today = decodeTodoDate("2026-04-01")
  const snapshot = deriveTodoDashboardSnapshot(
    [
      makeTodo({ title: "Completed", completed: true }),
      makeTodo({
        title: "Today",
        completed: false,
        dueDate: today,
      }),
      makeTodo({ title: "Backlog", completed: false }),
    ],
    today,
  )

  expect(snapshot.stats).toMatchObject({
    total: 3,
    active: 2,
    completed: 1,
    dueToday: 1,
    unscheduled: 1,
  })
  expect(snapshot.groups.map((group) => [group.key, group.count])).toEqual([
    ["overdue", 0],
    ["today", 1],
    ["upcoming", 0],
    ["unscheduled", 1],
    ["completed", 1],
  ])
})
