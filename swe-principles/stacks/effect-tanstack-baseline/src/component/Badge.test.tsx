import { Badge } from "@/design-system/components/Badge"
import { expect, test } from "vitest"
import { render } from "vitest-browser-react"
import { page } from "vitest/browser"

test("Badge uses the high-contrast neutral contract", async () => {
  await render(
    <Badge>
      Due 26. März 2026
    </Badge>,
  )

  const badge = page.getByText("Due 26. März 2026")

  await expect.element(badge).toBeVisible()
  await expect.element(badge).toHaveClass(/bg-bg-surface/)
  await expect.element(badge).toHaveClass(/text-text-primary/)
  await expect.element(badge).toHaveClass(/border-border-default/)
})

test("Badge keeps semantic tones while using primary text for contrast", async () => {
  await render(
    <>
      <Badge tone="accent">
        Accent
      </Badge>
      <Badge tone="success">
        Success
      </Badge>
      <Badge tone="danger">
        Danger
      </Badge>
    </>,
  )

  await expect.element(page.getByText("Accent")).toHaveClass(/bg-bg-accent/)
  await expect.element(page.getByText("Accent")).toHaveClass(
    /text-text-primary/,
  )

  await expect.element(page.getByText("Success")).toHaveClass(/bg-bg-success/)
  await expect.element(page.getByText("Success")).toHaveClass(
    /text-text-primary/,
  )

  await expect.element(page.getByText("Danger")).toHaveClass(/bg-bg-danger/)
  await expect.element(page.getByText("Danger")).toHaveClass(
    /text-text-primary/,
  )
})
