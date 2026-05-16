import { Card } from "@/design-system/components/Card"
import { Heading } from "@/design-system/components/Heading"
import { Text } from "@/design-system/components/Text"
import { Stack } from "@/design-system/primitives/Stack"
import type { ReactNode } from "react"

type EmptyStateProps = {
  readonly title: string
  readonly description: string
  readonly action?: ReactNode | undefined
}

/**
 * Standard empty-state pattern.
 *
 * Uses `role="status"` so assistive technology announces the
 * empty state without interrupting the user.
 *
 * @param props - Empty-state props.
 * @param props.title - Empty-state title.
 * @param props.description - Supporting text.
 * @param props.action - Optional recovery or creation action.
 * @returns A semantic empty-state surface.
 */
export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <Card tone="subtle">
      <div role="status">
        <Stack gap="s" align="center">
          <Heading as="h2" tone="section">
            {title}
          </Heading>
          <Text tone="muted" align="center">
            {description}
          </Text>
          {action}
        </Stack>
      </div>
    </Card>
  )
}
