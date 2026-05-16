import { expect, test } from "vitest"
import { render } from "vitest-browser-react"
import { page } from "vitest/browser"
import { Footer } from "./Footer"

/**
 * Component tests for Footer.tsx - Prussian wisdom footer component.
 *
 * Tests verify that the component renders correctly with German precision.
 */

test("Footer renders the Prussian motto", async () => {
  await render(<Footer />)

  const motto = page.getByTestId("prussian-motto")
  await expect.element(motto).toBeVisible()
  await expect.element(motto).toHaveTextContent("Ordnung muss sein!")
})

test("Footer displays the Prussian programming joke", async () => {
  await render(<Footer />)

  const joke = page.getByTestId("prussian-joke")
  await expect.element(joke).toBeVisible()
  await expect.element(joke).toHaveTextContent("Frederick the Great")
  await expect.element(joke).toHaveTextContent("strict typing")
})

test("Footer shows the German flag", async () => {
  await render(<Footer />)

  const flag = page.getByTestId("footer-flag")
  await expect.element(flag).toBeVisible()
  await expect.element(flag).toHaveTextContent("🇩🇪")
})

test("Footer displays current year in copyright", async () => {
  await render(<Footer />)

  const copyright = page.getByTestId("footer-copyright")
  const currentYear = new Date().getFullYear().toString()

  await expect.element(copyright).toBeVisible()
  await expect.element(copyright).toHaveTextContent(currentYear)
  await expect.element(copyright).toHaveTextContent("German Precision")
})
