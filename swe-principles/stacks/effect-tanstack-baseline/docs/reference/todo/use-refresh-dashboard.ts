import { useAtomRefresh } from "@effect/atom-react"
import { dashboardSnapshotAtom } from "./atoms"

/**
 * Returns a stable callback that refreshes the shared dashboard snapshot.
 *
 * @returns A callback that refreshes all derived dashboard views at once.
 */
export function useRefreshDashboard() {
  return useAtomRefresh(dashboardSnapshotAtom)
}
