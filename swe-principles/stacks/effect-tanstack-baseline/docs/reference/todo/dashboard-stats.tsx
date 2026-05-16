import { StatCard } from "@/design-system/components/StatCard"
import { Text } from "@/design-system/components/Text"
import { Grid } from "@/design-system/primitives/Grid"
import { useAtomValue } from "@effect/atom-react"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { todoStatsAtom } from "./atoms"

/**
 * Renders the dashboard summary statistics.
 *
 * @returns The summary statistics surface.
 */
export function DashboardStats() {
  const result = useAtomValue(todoStatsAtom)

  return AsyncResult
    .builder(result)
    .onInitial(() => (
      <Text tone="muted">
        Loading dashboard summary…
      </Text>
    ))
    .onFailure(() => (
      <Text tone="muted">
        Summary unavailable.
      </Text>
    ))
    .onSuccess((stats) => (
      <Grid layout="stats">
        <StatCard label="Total" value={stats.total} helper="All tracked work" />
        <StatCard
          label="Active"
          value={stats.active}
          helper={`${stats.dueToday} due today · ${stats.upcoming} upcoming`}
          tone="accent"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          helper="Needs attention now"
          tone="danger"
        />
        <StatCard
          label="Unscheduled"
          value={stats.unscheduled}
          helper="No due date yet"
        />
      </Grid>
    ))
    .render()
}
