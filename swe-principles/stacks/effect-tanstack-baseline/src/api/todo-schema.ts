import * as Schema from "effect/Schema"

export const TodoId = Schema.String.pipe(Schema.brand("TodoId"))
export type TodoId = typeof TodoId.Type

const todoDateParts = /^\d{4}-\d{2}-\d{2}$/

const isValidTodoDate = (input: string): boolean => {
  if (!todoDateParts.test(input)) {
    return false
  }

  const [yearText, monthText, dayText] = input.split("-")
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)

  if (
    !Number.isInteger(year) || !Number.isInteger(month) || !Number
      .isInteger(day)
  ) {
    return false
  }

  const candidate = new Date(Date.UTC(year, month - 1, day))

  return candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day
}

export const TodoDate = Schema.declare(
  (input): input is string =>
    typeof input === "string" && isValidTodoDate(input),
  {
    description: "UTC calendar day in YYYY-MM-DD format",
    identifier: "TodoDate",
  },
)
export type TodoDate = typeof TodoDate.Type

export const Todo = Schema.Struct({
  id: TodoId,
  title: Schema.String,
  completed: Schema.Boolean,
  dueDate: Schema.NullOr(TodoDate),
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
})
export type Todo = typeof Todo.Type

export const TodoStats = Schema.Struct({
  total: Schema.Number,
  active: Schema.Number,
  completed: Schema.Number,
  overdue: Schema.Number,
  dueToday: Schema.Number,
  upcoming: Schema.Number,
  unscheduled: Schema.Number,
})
export type TodoStats = typeof TodoStats.Type

export type TodoGroupKey =
  | "overdue"
  | "today"
  | "upcoming"
  | "unscheduled"
  | "completed"

export const TodoGroupKey = Schema.String

export const TodoGroup = Schema.Struct({
  key: TodoGroupKey,
  label: Schema.String,
  count: Schema.Number,
  todos: Schema.Array(Todo),
})
export type TodoGroup = typeof TodoGroup.Type

export const TodoDashboardSnapshot = Schema.Struct({
  todos: Schema.Array(Todo),
  stats: TodoStats,
  groups: Schema.Array(TodoGroup),
})
export type TodoDashboardSnapshot = typeof TodoDashboardSnapshot.Type

export const CreateTodoInput = Schema.Struct({
  title: Schema.NonEmptyString,
  dueDate: Schema.NullOr(TodoDate),
})
export type CreateTodoInput = typeof CreateTodoInput.Type

export const UpdateTodoInput = Schema.Struct({
  title: Schema.OptionFromOptionalKey(Schema.NonEmptyString),
  completed: Schema.OptionFromOptionalKey(Schema.Boolean),
  dueDate: Schema.OptionFromOptionalKey(Schema.NullOr(TodoDate)),
})
export type UpdateTodoInput = typeof UpdateTodoInput.Type

export class TodoNotFound extends Schema.TaggedErrorClass<TodoNotFound>()(
  "TodoNotFound",
  {
    id: TodoId,
  },
  { httpApiStatus: 404 },
) {}
