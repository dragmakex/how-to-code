import { Footer } from "@/component/Footer"
import { Card } from "@/design-system/components/Card"
import { Page } from "@/design-system/components/Page"
import { PageHeader } from "@/design-system/components/PageHeader"
import { Text } from "@/design-system/components/Text"
import { Grid } from "@/design-system/primitives/Grid"
import { Stack } from "@/design-system/primitives/Stack"
import { useState } from "react"
import { CreateTodoForm } from "./create-todo-form"
import { type DashboardFilter, dashboardFilterKeys } from "./dashboard-filters"
import { DashboardStats } from "./dashboard-stats"
import { GroupedTodoBoard } from "./grouped-todo-board"
import { RecentActivity } from "./recent-activity"

const defaultFilter: DashboardFilter = dashboardFilterKeys[0]

/**
 * The main application component.
 *
 * @returns The rendered application.
 */
export function App() {
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>(
    defaultFilter,
  )

  return (
    <Page>
      <Stack gap="xl">
        <PageHeader
          title="Todo control room"
          description="A richer todo dashboard that keeps the canonical list, grouped board, and summary counts synchronized from one mutation response."
        />
        <CreateTodoForm />
        <DashboardStats />
        <Grid layout="dashboard">
          <GroupedTodoBoard
            activeFilter={activeFilter}
            onChangeFilter={setActiveFilter}
          />
          <Stack gap="l">
            <RecentActivity />
            <Card tone="subtle">
              <Stack gap="s">
                <Text>
                  This sample intentionally goes beyond flat CRUD.
                </Text>
                <Text tone="muted">
                  It demonstrates server-derived dashboard snapshots, SSR
                  hydration of multiple read models, and disciplined UI
                  composition through the current design system.
                </Text>
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Stack>
      <Footer />
    </Page>
  )
}
