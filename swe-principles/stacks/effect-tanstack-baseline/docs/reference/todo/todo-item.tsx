import type { Todo } from "@/api/todo-schema"
import { Badge } from "@/design-system/components/Badge"
import { Button } from "@/design-system/components/Button"
import { Card } from "@/design-system/components/Card"
import { Checkbox } from "@/design-system/components/Checkbox"
import { Heading } from "@/design-system/components/Heading"
import { Text } from "@/design-system/components/Text"
import { TextField } from "@/design-system/components/TextField"
import { Expand } from "@/design-system/primitives/Expand"
import { Grid } from "@/design-system/primitives/Grid"
import { Inline } from "@/design-system/primitives/Inline"
import { Stack } from "@/design-system/primitives/Stack"
import { useAtom } from "@effect/atom-react"
import * as Option from "effect/Option"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { useState } from "react"
import { deleteTodoAtom, updateTodoAtom } from "./atoms"
import { formatTodoDate, parseTodoDateInput, todayTodoDate } from "./todo-date"
import { useRefreshDashboard } from "./use-refresh-dashboard"

const dueTone = (todo: Todo): "accent" | "danger" | "success" | "neutral" => {
  if (todo.completed) {
    return "success"
  }
  if (todo.dueDate === null) {
    return "neutral"
  }
  return todo.dueDate < todayTodoDate() ? "danger" : "accent"
}

const dueLabel = (todo: Todo): string => {
  if (todo.completed) {
    return todo.dueDate === null
      ? "Completed"
      : `Completed · due ${formatTodoDate(todo.dueDate)}`
  }

  if (todo.dueDate === null) {
    return "Unscheduled"
  }

  return `Due ${formatTodoDate(todo.dueDate)}`
}

const updatedLabel = (todo: Todo): string => {
  const date = new Date(todo.updatedAt.epochMilliseconds)
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const min = String(date.getMinutes()).padStart(2, "0")
  const ss = String(date.getSeconds()).padStart(2, "0")
  return `Updated ${yyyy}-${mm}-${dd}, ${hh}:${min}:${ss}`
}

/**
 * Renders a single todo item, allowing for toggling completion, editing, and deletion.
 *
 * @param props - The properties for the TodoItem component.
 * @param props.todo - The todo object to display.
 * @returns The rendered todo item.
 */
export function TodoItem({ todo }: { readonly todo: Todo }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const [editDueDate, setEditDueDate] = useState(todo.dueDate ?? "")
  const [updateResult, update] = useAtom(updateTodoAtom)
  const [deleteResult, deleteTodo] = useAtom(deleteTodoAtom)
  const refreshDashboard = useRefreshDashboard()

  const handleToggle = () => {
    update({
      id: todo.id,
      input: {
        title: Option.none(),
        completed: Option.some(!todo.completed),
        dueDate: Option.none(),
      },
    })
  }

  const handleDelete = () => {
    deleteTodo(todo.id)
  }

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      return
    }
    const dueDateValue = parseTodoDateInput(editDueDate)
    update({
      id: todo.id,
      input: {
        title: Option.some(editTitle.trim()),
        completed: Option.none(),
        dueDate: Option.some(dueDateValue),
      },
    })
    setIsEditing(false)
  }

  const isLoading = updateResult.waiting || deleteResult.waiting
  const hasError = AsyncResult.isFailure(updateResult)
    || AsyncResult.isFailure(deleteResult)

  return (
    <Card tone={hasError ? "danger" : "default"}>
      <Stack gap="m">
        <Inline align="between" wrap>
          <Expand>
            <Checkbox
              checked={todo.completed}
              disabled={isLoading}
              onChange={handleToggle}
              label={
                <Heading as="h4" tone="card">
                  {todo.title}
                </Heading>
              }
              hint={updatedLabel(todo)}
            />
          </Expand>
          <Inline gap="xs" wrap>
            <Badge tone={dueTone(todo)}>
              {dueLabel(todo)}
            </Badge>
            <Button
              variant="ghost"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isLoading}
              loading={deleteResult.waiting}
            >
              Delete
            </Button>
          </Inline>
        </Inline>
        {isEditing && (
          <Stack gap="m">
            <Grid layout="form">
              <TextField
                label="Task title"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
              />
              <TextField
                label="Due date"
                type="date"
                value={editDueDate}
                onChange={(event) => setEditDueDate(event.target.value)}
              />
              <Inline gap="xs" wrap>
                <Button onClick={handleSaveEdit} loading={updateResult.waiting}>
                  Save
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false)
                    setEditTitle(todo.title)
                    setEditDueDate(todo.dueDate ?? "")
                  }}
                >
                  Cancel
                </Button>
              </Inline>
            </Grid>
          </Stack>
        )}
        {hasError && (
          <Inline gap="xs" wrap>
            <Text tone="danger">
              Operation failed. Refresh the dashboard to recover canonical
              state.
            </Text>
            <Button variant="secondary" onClick={refreshDashboard}>
              Refresh dashboard
            </Button>
          </Inline>
        )}
      </Stack>
    </Card>
  )
}
