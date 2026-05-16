import { Badge } from "@/design-system/components/Badge"
import { Card } from "@/design-system/components/Card"
import { Heading } from "@/design-system/components/Heading"
import { Text } from "@/design-system/components/Text"
import { Inline } from "@/design-system/primitives/Inline"
import { Stack } from "@/design-system/primitives/Stack"
import { useAtomValue } from "@effect/atom-react"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { todosAtom } from "./atoms"
import { formatTodoDate } from "./todo-date"

/**
 * Renders a compact recent-activity view based on the canonical todo list atom.
 *
 * @returns A recent activity side panel.
 */
export function RecentActivity() {
  const result = useAtomValue(todosAtom)

  return AsyncResult
    .builder(result)
    .onInitial(() => (
      <Text tone="muted">
        Loading recent activity…
      </Text>
    ))
    .onFailure(() => (
      <Text tone="muted">
        Recent activity unavailable.
      </Text>
    ))
    .onSuccess((todos) => (
      <Card>
        <Stack gap="m">
          <Stack gap="2xs">
            <Heading as="h2" tone="section">
              Recent activity
            </Heading>
            <Text tone="muted">
              The canonical list powers this panel and the grouped board.
            </Text>
          </Stack>
          <Stack gap="s">
            {todos.slice(0, 5).map((todo) => (
              <Stack key={todo.id} gap="2xs">
                <Text>
                  {todo.title}
                </Text>
                <Inline gap="xs" wrap>
                  <Badge tone={todo.completed ? "success" : "neutral"}>
                    {todo.completed ? "Completed" : "Open"}
                  </Badge>
                  {todo.dueDate !== null && (
                    <Badge tone="accent">
                      Due {formatTodoDate(todo.dueDate)}
                    </Badge>
                  )}
                  {todo.dueDate === null && !todo.completed && (
                    <Badge tone="neutral">
                      Unscheduled
                    </Badge>
                  )}
                </Inline>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Card>
    ))
    .render()
}
