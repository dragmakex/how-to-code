import { Card } from "@/design-system/components/Card"
import { Heading } from "@/design-system/components/Heading"
import { Text } from "@/design-system/components/Text"
import { Stack } from "@/design-system/primitives/Stack"

type StatCardProps = {
  readonly label: string
  readonly value: number
  readonly helper?: string | undefined
  readonly tone?: "default" | "accent" | "danger" | undefined
}

/**
 * Renders a compact dashboard summary statistic card.
 *
 * @param props - Stat card props.
 * @param props.label - Metric label.
 * @param props.value - Metric value.
 * @param props.helper - Optional helper copy.
 * @param props.tone - Surface tone role.
 * @returns A summary card.
 */
export function StatCard(
  { helper, label, tone = "default", value }: StatCardProps,
) {
  return (
    <Card tone={tone === "default" ? "default" : tone}>
      <div className="min-w-0">
        <Stack gap="2xs">
          <Text tone="label" as="span">
            {label}
          </Text>
          <Heading as="h3" tone="display">
            {value}
          </Heading>
          {helper && (
            <Text tone="caption">
              {helper}
            </Text>
          )}
        </Stack>
      </div>
    </Card>
  )
}
