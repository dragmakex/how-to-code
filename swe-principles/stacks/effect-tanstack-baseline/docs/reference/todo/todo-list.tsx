import { useState } from "react"
import { type DashboardFilter, dashboardFilterKeys } from "./dashboard-filters"
import { GroupedTodoBoard } from "./grouped-todo-board"

const defaultFilter: DashboardFilter = dashboardFilterKeys[0]

/**
 * Legacy compatibility wrapper for the grouped todo board.
 *
 * @returns The grouped todo dashboard board.
 */
export function TodoList() {
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>(
    defaultFilter,
  )

  return (
    <GroupedTodoBoard
      activeFilter={activeFilter}
      onChangeFilter={setActiveFilter}
    />
  )
}
