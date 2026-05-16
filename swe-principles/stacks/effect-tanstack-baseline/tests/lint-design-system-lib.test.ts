import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { cwd } from "node:process"
import { afterEach, describe, expect, it } from "vitest"
import {
  findUnregisteredComponents,
  lintDesignSystem,
} from "../scripts/lint-design-system-lib"

const tempDirectories: Array<string> = []

const writeFixture = (source: string): string => {
  const directory = mkdtempSync(join(cwd(), "src/routes/.tmp-ds-lint-"))
  tempDirectories.push(directory)

  const file = join(directory, "example.tsx")
  const parent = file.slice(0, file.lastIndexOf("/"))

  mkdirSync(parent, { recursive: true })
  writeFileSync(file, source, { encoding: "utf8", flush: true })

  return file
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe("lintDesignSystem", () => {
  it("passes when app code uses only design-system components", () => {
    const file = writeFixture(
      [
        "import { Button } from '@/design-system/components/Button'",
        "export const Example = () => <Button>Save</Button>",
      ]
        .join("\n"),
    )

    const violations = lintDesignSystem([file])

    expect(violations).toHaveLength(0)
  })

  it("flags className usage in app code", () => {
    const file = writeFixture(
      [
        "export const Example = () => (",
        "  <div className=\"flex gap-4\">Content</div>",
        ")",
      ]
        .join("\n"),
    )

    const violations = lintDesignSystem([file])

    expect(violations).toHaveLength(1)
    expect(violations[0]?.message).toContain("className")
  })

  it("flags inline style usage in app code", () => {
    const file = writeFixture(
      [
        "export const Example = () => (",
        "  <div style={{ color: 'red' }}>Content</div>",
        ")",
      ]
        .join("\n"),
    )

    const violations = lintDesignSystem([file])

    expect(violations).toHaveLength(1)
    expect(violations[0]?.message).toContain("style")
  })

  it("flags route-local styled native controls", () => {
    const file = writeFixture(
      [
        "export const Example = () => (",
        "  <button className=\"bg-blue-500\">Delete</button>",
        ")",
      ]
        .join("\n"),
    )

    const violations = lintDesignSystem([file])

    expect(violations.length).toBeGreaterThanOrEqual(1)
    expect(
      violations.some((v) => v.message.includes("native controls")),
    )
      .toBe(true)
  })

  it("ignores documented exceptions on the previous line", () => {
    const file = writeFixture(
      [
        "export const Example = () => (",
        "  // ds-exception: third-party widget controls styling internally",
        "  <div className=\"widget-root\">Widget</div>",
        ")",
      ]
        .join("\n"),
    )

    const violations = lintDesignSystem([file])

    expect(violations).toHaveLength(0)
  })

  it("ignores documented exceptions on the same line", () => {
    const file = writeFixture(
      [
        "export const Example = () => (",
        "  <div className=\"widget\" /> // ds-exception: external widget",
        ")",
      ]
        .join("\n"),
    )

    const violations = lintDesignSystem([file])

    expect(violations).toHaveLength(0)
  })

  it("flags exceptions without a reason", () => {
    const file = writeFixture(
      [
        "export const Example = () => (",
        "  // ds-exception:",
        "  <div className=\"flex\">Content</div>",
        ")",
      ]
        .join("\n"),
    )

    const violations = lintDesignSystem([file])

    expect(violations).toHaveLength(1)
  })

  it("ignores files outside the scoped directories", () => {
    const directory = mkdtempSync(join(cwd(), "src/lib/.tmp-ds-lint-"))
    tempDirectories.push(directory)

    const file = join(directory, "utils.tsx")
    writeFileSync(file, "<div className=\"flex\">Content</div>", {
      encoding: "utf8",
      flush: true,
    })

    const violations = lintDesignSystem([file])

    expect(violations).toHaveLength(0)
  })
})

describe("findUnregisteredComponents", () => {
  it("reports no unregistered files for the current design system", () => {
    const unregistered = findUnregisteredComponents()

    expect(unregistered).toHaveLength(0)
  })

  it("detects an unregistered file", () => {
    const rogue = join(cwd(), "src/design-system/components/Rogue.tsx")
    writeFileSync(rogue, "export function Rogue() { return null }", {
      encoding: "utf8",
      flush: true,
    })
    tempDirectories.push("") // placeholder so cleanup runs
    try {
      const unregistered = findUnregisteredComponents()
      expect(unregistered).toContain("components/Rogue.tsx")
    } finally {
      rmSync(rogue, { force: true })
    }
  })
})
