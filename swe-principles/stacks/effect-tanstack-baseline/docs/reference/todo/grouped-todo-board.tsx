import type { TodoGroup } from "@/api/todo-schema"
import { Button } from "@/design-system/components/Button"
import { Card } from "@/design-system/components/Card"
import { EmptyState } from "@/design-system/components/EmptyState"
import { ErrorState } from "@/design-system/components/ErrorState"
import { Heading } from "@/design-system/components/Heading"
import { Text } from "@/design-system/components/Text"
import { Inline } from "@/design-system/primitives/Inline"
import { Stack } from "@/design-system/primitives/Stack"
import { useAtomValue } from "@effect/atom-react"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { todoGroupsAtom, todoStatsAtom } from "./atoms"
import { type DashboardFilter, DashboardFilters } from "./dashboard-filters"
import { TodoGroupSection } from "./todo-group-section"
import { useRefreshDashboard } from "./use-refresh-dashboard"

const filterGroups = (
  groups: ReadonlyArray<TodoGroup>,
  filter: DashboardFilter,
): ReadonlyArray<TodoGroup> => {
  switch (filter) {
    case "all":
      return groups
    case "active":
      return groups.filter((group) => group.key !== "completed")
    case "overdue":
      return groups.filter((group) => group.key === "overdue")
    case "unscheduled":
      return groups.filter((group) => group.key === "unscheduled")
    case "completed":
      return groups.filter((group) => group.key === "completed")
  }
}

type GroupedTodoBoardProps = {
  readonly activeFilter: DashboardFilter
  readonly onChangeFilter: (filter: DashboardFilter) => void
}

/**
 * Renders grouped todo sections and filter controls.
 *
 * @param props - Board props.
 * @param props.activeFilter - Current dashboard filter.
 * @param props.onChangeFilter - Filter change callback.
 * @returns The grouped todo board.
 */
export function GroupedTodoBoard(
  { activeFilter, onChangeFilter }: GroupedTodoBoardProps,
) {
  const groupsResult = useAtomValue(todoGroupsAtom)
  const statsResult = useAtomValue(todoStatsAtom)
  const refreshDashboard = useRefreshDashboard()

  return AsyncResult
    .builder(statsResult)
    .onInitial(() => (
      <Text tone="muted">
        Loading dashboard views…
      </Text>
    ))
    .onFailure(() => (
      <ErrorState
        title="Dashboard views unavailable"
        description="The grouped board could not be refreshed."
        actionLabel="Retry"
        onAction={refreshDashboard}
      />
    ))
    .onSuccess((stats) => (
      <Card>
        <Stack gap="l">
          <Inline align="between" wrap>
            <Stack gap="2xs">
              <Heading as="h2" tone="section">
                Execution board
              </Heading>
              <Text tone="muted">
                One mutation refreshes the canonical list, grouped board, and
                summary counts.
              </Text>
            </Stack>
            <Button variant="secondary" onClick={refreshDashboard}>
              Refresh
            </Button>
          </Inline>
          <DashboardFilters
            activeFilter={activeFilter}
            onChange={onChangeFilter}
            stats={stats}
          />
          {AsyncResult
            .builder(groupsResult)
            .onInitial(() => (
              <Text tone="muted">
                Loading grouped work…
              </Text>
            ))
            .onFailure(() => (
              <ErrorState
                title="Grouped work unavailable"
                description="The board could not be refreshed."
                actionLabel="Retry"
                onAction={refreshDashboard}
              />
            ))
            .onSuccess((groups) => {
              const visibleGroups = filterGroups(groups, activeFilter)
              const populatedGroups = visibleGroups.filter((group) =>
                group.count > 0
              )
              const visibleCount = populatedGroups.reduce(
                (count, group) => count + group.todos.length,
                0,
              )

              return visibleCount === 0
                ? (
                  <EmptyState
                    title="No work in this view"
                    description="Try another filter or add a task with a due date."
                  />
                )
                : (
                  <Stack gap="l">
                    {populatedGroups.map((group) => (
                      <TodoGroupSection key={group.key} group={group} />
                    ))}
                  </Stack>
                )
            })
            .render()}
        </Stack>
      </Card>
    ))
    .render()
}
