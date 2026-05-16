import { getTodoDashboardSnapshot } from "@/features/todos/application"
import { HydrationBoundary } from "@/lib/atom-hydration"
import { dehydrate } from "@/lib/atom-utils"
import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { App } from "./-index/app"
import { dashboardSnapshotAtom } from "./-index/atoms"
import { serverRuntime } from "./api/$"

const getTodoDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const snapshot = await serverRuntime.runPromise(getTodoDashboardSnapshot)
  const dehydratedAt = Date.now()

  return [
    dehydrate(
      dashboardSnapshotAtom.remote,
      AsyncResult.success(snapshot),
      dehydratedAt,
    ),
  ]
})

export const Route = createFileRoute("/")({
  loader: () => getTodoDashboard(),
  component: AppWrapper,
})

/**
 * Wraps the main application component with a HydrationBoundary to provide dehydrated data.
 *
 * @returns The wrapped application component.
 */
function AppWrapper() {
  const dehydrated = Route.useLoaderData()
  return (
    <HydrationBoundary state={dehydrated}>
      <App />
    </HydrationBoundary>
  )
}
