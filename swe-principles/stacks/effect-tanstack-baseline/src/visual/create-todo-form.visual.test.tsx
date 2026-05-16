import { expect, test } from "vitest"
import { render } from "vitest-browser-react"
import { page } from "vitest/browser"
import { CreateTodoForm } from "../routes/-index/create-todo-form"

/**
 * Visual Regression Tests for CreateTodoForm
 *
 * These tests capture screenshots and compare them against reference images
 * to catch unintended visual changes across different browsers.
 */

test("CreateTodoForm renders correctly in default state", async () => {
  const screen = await render(<CreateTodoForm />)

  // Wait for the form to be fully rendered
  await expect
    .element(page.getByPlaceholder("What needs to be done?"))
    .toBeVisible()

  // Capture screenshot of the form in its initial state
  await expect(screen.container).toMatchScreenshot("create-todo-form-default")
})

test("CreateTodoForm shows submit button as disabled when input is empty", async () => {
  const screen = await render(<CreateTodoForm />)

  // Wait for elements to be visible
  await expect.element(page.getByRole("button", { name: /add/i })).toBeVisible()

  // Capture screenshot showing disabled state
  await expect(screen.container).toMatchScreenshot(
    "create-todo-form-empty-disabled",
  )
})

test("CreateTodoForm shows enabled state with text input", async () => {
  const screen = await render(<CreateTodoForm />)

  const input = page.getByPlaceholder("What needs to be done?")

  // Type some text
  await input.fill("Write some tests")

  // Capture screenshot with text entered and button enabled
  await expect(screen.container).toMatchScreenshot("create-todo-form-with-text")
})

test("CreateTodoForm maintains consistent styling across viewports", async () => {
  const screen = await render(<CreateTodoForm />)

  // Wait for the form to render
  await expect
    .element(page.getByPlaceholder("What needs to be done?"))
    .toBeVisible()

  // This test will run across all configured browsers (chromium, firefox, webkit)
  // and generate separate screenshots for each to detect browser-specific rendering issues
  await expect(screen.container).toMatchScreenshot(
    "create-todo-form-cross-browser",
  )
})
