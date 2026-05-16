import type { TodoStats } from "@/api/todo-schema"
import { Tabs } from "@/design-system/components/Tabs"

export const dashboardFilterKeys = [
  "all",
  "active",
  "overdue",
  "unscheduled",
  "completed",
] as const

export type DashboardFilter = typeof dashboardFilterKeys[number]

type DashboardFiltersProps = {
  readonly activeFilter: DashboardFilter
  readonly onChange: (filter: DashboardFilter) => void
  readonly stats: TodoStats
}

/**
 * Renders the dashboard filter tabs.
 *
 * @param props - Filter props.
 * @param props.activeFilter - Current filter.
 * @param props.onChange - Filter change callback.
 * @param props.stats - Dashboard counts used in tab badges.
 * @returns A semantic tab list.
 */
export function DashboardFilters(
  { activeFilter, onChange, stats }: DashboardFiltersProps,
) {
  return (
    <Tabs
      id="todos"
      activeTab={activeFilter}
      onChange={onChange}
      items={[
        { key: "all", label: "All work", count: stats.total },
        { key: "active", label: "Active", count: stats.active },
        { key: "overdue", label: "Overdue", count: stats.overdue },
        {
          key: "unscheduled",
          label: "Unscheduled",
          count: stats.unscheduled,
        },
        { key: "completed", label: "Completed", count: stats.completed },
      ]}
    />
  )
}
