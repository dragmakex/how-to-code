import type { TodoGroup } from "@/api/todo-schema"
import { Badge } from "@/design-system/components/Badge"
import { Heading } from "@/design-system/components/Heading"
import { Text } from "@/design-system/components/Text"
import { Inline } from "@/design-system/primitives/Inline"
import { Stack } from "@/design-system/primitives/Stack"
import { TodoItem } from "./todo-item"

type TodoGroupSectionProps = {
  readonly group: TodoGroup
}

/**
 * Renders a labeled todo group section with its count and items.
 *
 * @param props - Section props.
 * @param props.group - Group metadata and todos.
 * @returns A semantic group section.
 */
export function TodoGroupSection({ group }: TodoGroupSectionProps) {
  return (
    <Stack gap="m">
      <Inline align="between" wrap>
        <Stack gap="2xs">
          <Heading as="h3" tone="section">
            {group.label}
          </Heading>
          <Text tone="muted">
            {group.count === 0
              ? "No tasks in this group."
              : `${group.count} task${group.count === 1 ? "" : "s"}`}
          </Text>
        </Stack>
        <Badge tone="neutral">
          {group.count}
        </Badge>
      </Inline>
      <Stack gap="s">
        {group.todos.map((todo) => <TodoItem key={todo.id} todo={todo} />)}
      </Stack>
    </Stack>
  )
}
