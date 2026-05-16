import { Button } from "@/design-system/components/Button"
import { Card } from "@/design-system/components/Card"
import { Heading } from "@/design-system/components/Heading"
import { Text } from "@/design-system/components/Text"
import { TextField } from "@/design-system/components/TextField"
import { Grid } from "@/design-system/primitives/Grid"
import { Stack } from "@/design-system/primitives/Stack"
import { useAtom } from "@effect/atom-react"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { type FormEvent, useState } from "react"
import { createTodoAtom } from "./atoms"
import { parseTodoDateInput } from "./todo-date"

/**
 * A form component for creating new todo items.
 *
 * @returns The rendered form.
 */
export function CreateTodoForm() {
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [createResult, create] = useAtom(createTodoAtom)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title.trim()) {
      return
    }

    create({ title: title.trim(), dueDate: parseTodoDateInput(dueDate) })
    setTitle("")
    setDueDate("")
  }

  const hasError = AsyncResult.isFailure(createResult)

  return (
    <Card>
      <Stack gap="m">
        <Stack gap="2xs">
          <Heading as="h2" tone="section">
            Create work
          </Heading>
          <Text tone="muted">
            Give tasks a due date so the dashboard can classify urgency
            precisely.
          </Text>
        </Stack>
        <Grid layout="form" as="form" onSubmit={handleSubmit}>
          <TextField
            label="Task title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ship the full dashboard"
            disabled={createResult.waiting}
          />
          <TextField
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            disabled={createResult.waiting}
          />
          <Button
            type="submit"
            loading={createResult.waiting}
            disabled={!title.trim()}
          >
            Add task
          </Button>
        </Grid>
        {hasError && (
          <Text tone="danger">
            Failed to create the task. Retry after refreshing the dashboard.
          </Text>
        )}
      </Stack>
    </Card>
  )
}
