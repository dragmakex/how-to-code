import { Checkbox } from "@/design-system/components/Checkbox"
import { Heading } from "@/design-system/components/Heading"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

describe("Checkbox", () => {
  it("links hint text with aria-describedby", () => {
    const markup = renderToStaticMarkup(
      <Checkbox
        id="terms"
        label="Accept terms"
        hint="Required before continuing"
      />,
    )

    expect(markup).toContain("id=\"terms\"")
    expect(markup).toContain("aria-describedby=\"terms-hint\"")
    expect(markup).toContain("id=\"terms-hint\"")
  })

  it("preserves rich label content without wrapping it in extra text styling", () => {
    const markup = renderToStaticMarkup(
      <Checkbox
        id="todo"
        label={
          <Heading as="h4" tone="card">
            Important task
          </Heading>
        }
      />,
    )

    expect(markup).toContain("<h4")
    expect(markup).toContain("Important task")
  })
})
