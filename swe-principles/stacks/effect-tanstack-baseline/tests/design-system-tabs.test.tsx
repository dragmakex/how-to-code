import { TabPanel, Tabs } from "@/design-system/components/Tabs"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

describe("Tabs", () => {
  it("links tabs to their panels with shared ids", () => {
    const tabsMarkup = renderToStaticMarkup(
      <Tabs
        activeTab="all"
        items={[
          { key: "all", label: "All" },
          { key: "done", label: "Done", count: 3 },
        ]}
        onChange={() => undefined}
        id="todos"
      />,
    )

    const panelMarkup = renderToStaticMarkup(
      <TabPanel activeTab="all" tab="all" tabsId="todos">
        Content
      </TabPanel>,
    )

    expect(tabsMarkup).toContain("id=\"todos-all-tab\"")
    expect(tabsMarkup).toContain("aria-controls=\"todos-all-panel\"")
    expect(panelMarkup).toContain("id=\"todos-all-panel\"")
    expect(panelMarkup).toContain("aria-labelledby=\"todos-all-tab\"")
  })

  it("hides inactive panels", () => {
    const markup = renderToStaticMarkup(
      <TabPanel activeTab="all" tab="done" tabsId="todos">
        Hidden content
      </TabPanel>,
    )

    expect(markup).toContain("hidden")
  })
})
