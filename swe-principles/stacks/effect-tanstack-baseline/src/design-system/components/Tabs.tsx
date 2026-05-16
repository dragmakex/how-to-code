import { cx } from "@/design-system/foundation/classes"
import { type ReactNode, useId } from "react"
import { Badge } from "./Badge"

type TabItem<T extends string> = {
  readonly key: T
  readonly label: string
  readonly count?: number | undefined
}

type TabsProps<T extends string> = {
  readonly activeTab: T
  readonly items: ReadonlyArray<TabItem<T>>
  readonly onChange: (nextTab: T) => void
  readonly id?: string | undefined
}

const tabBase =
  "inline-flex items-center gap-xs min-h-10 px-m border border-transparent rounded-md bg-transparent text-text-secondary cursor-pointer"
const tabActive = "border-accent-wash bg-bg-surface text-text-primary shadow-sm"

const toDomId = (value: string): string =>
  value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "")

/**
 * Semantic tab list with ARIA roles.
 *
 * Renders a `role="tablist"` container with `role="tab"` children.
 * Pair with `TabPanel` for the corresponding content.
 *
 * @param props - Tabs props.
 * @param props.activeTab - Currently active tab key.
 * @param props.items - Available tab items.
 * @param props.onChange - Selection callback.
 * @param props.id - Shared id base for `TabPanel` linkage.
 * @returns A semantic tab list.
 */
export function Tabs<T extends string>(
  { activeTab, id, items, onChange }: TabsProps<T>,
) {
  const generatedId = useId().replaceAll(":", "")
  const tabsId = id ?? `tabs-${generatedId}`

  return (
    <div
      role="tablist"
      className="p-xs border border-border-default rounded-lg bg-bg-subtle flex flex-wrap gap-xs"
    >
      {items.map((item) => {
        const active = item.key === activeTab
        const itemId = toDomId(item.key)
        const tabId = `${tabsId}-${itemId}-tab`
        const panelId = `${tabsId}-${itemId}-panel`

        return (
          <button
            key={item.key}
            id={tabId}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId}
            className={cx(tabBase, active && tabActive)}
            onClick={() => onChange(item.key)}
          >
            <span>
              {item.label}
            </span>
            {typeof item.count === "number" && (
              <Badge tone={active ? "accent" : "neutral"}>
                {item
                  .count}
              </Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Semantic tab panel wrapper.
 *
 * @param props - Panel props.
 * @param props.children - Panel content.
 * @param props.activeTab - Currently selected tab key.
 * @param props.tab - Tab key this panel belongs to.
 * @param props.tabsId - Shared id base passed to `Tabs`.
 * @returns A semantic tab panel.
 */
export function TabPanel<T extends string>(
  { activeTab, children, tab, tabsId }: {
    readonly activeTab: T
    readonly children: ReactNode
    readonly tab: T
    readonly tabsId: string
  },
) {
  const itemId = toDomId(tab)
  const tabId = `${tabsId}-${itemId}-tab`
  const panelId = `${tabsId}-${itemId}-panel`
  const active = activeTab === tab

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      hidden={!active}
    >
      {children}
    </div>
  )
}
