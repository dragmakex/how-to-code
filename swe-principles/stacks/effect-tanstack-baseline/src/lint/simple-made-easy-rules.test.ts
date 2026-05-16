import { execFile } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { cwd } from "node:process"
import { promisify } from "node:util"
import { afterEach, describe, expect, it } from "vitest"

const execFileAsync = promisify(execFile)
const tempDirectories: Array<string> = []

type OxlintDiagnostic = {
  readonly code?: string
}

type OxlintReport = {
  readonly diagnostics?: ReadonlyArray<OxlintDiagnostic>
}

/**
 * Writes a temporary fixture file for Oxlint verification.
 *
 * @param filePath - Repo-relative fixture path used for rule scoping.
 * @param source - The source sample to lint.
 * @returns The absolute path to the written fixture.
 */
const writeFixture = (filePath: string, source: string): string => {
  const directory = mkdtempSync(join(cwd(), ".tmp-simple-made-easy-lint-"))
  tempDirectories.push(directory)

  const absolutePath = join(directory, filePath)
  const parent = absolutePath.slice(0, absolutePath.lastIndexOf("/"))

  mkdirSync(parent, { recursive: true })
  writeFileSync(absolutePath, source, { encoding: "utf8", flush: true })

  return absolutePath
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

/**
 * Runs Oxlint against a temporary source sample.
 *
 * Negative samples in this file are deliberately labelled inside their own
 * source text so they cannot be mistaken for production reference code.
 *
 * @param filePath - The repo-relative file path used for rule scoping.
 * @param source - The source sample to lint.
 * @returns The rule codes emitted for the sample.
 */
const lintText = async (
  filePath: string,
  source: string,
): Promise<ReadonlyArray<string>> => {
  const absolutePath = writeFixture(filePath, source)

  let stdout: string

  try {
    const result = await execFileAsync("node", [
      "./node_modules/oxlint/bin/oxlint",
      "--config",
      "oxlint.config.js",
      "--format",
      "json",
      absolutePath,
    ], { cwd: cwd() })
    stdout = result.stdout
  } catch (error) {
    stdout = String((error as { stdout?: string }).stdout ?? "")
  }

  const report = JSON.parse(stdout) as OxlintReport

  return (report.diagnostics ?? [])
    .map((diagnostic) => diagnostic.code)
    .filter((code): code is string => code !== undefined)
}

/**
 * Checks whether a rule code set contains a specific lint rule.
 *
 * @param codes - The emitted diagnostic codes.
 * @param ruleId - The rule identifier to search for.
 * @returns True when the rule is present in the result set.
 */
const hasRule = (
  codes: ReadonlyArray<string>,
  ruleId: string,
): boolean => {
  const oxlintCode = ruleId.replace("/", "(") + ")"

  return codes.some((code) =>
    code.includes(ruleId) || code.includes(oxlintCode)
  )
}

describe("simple made easy lint rules", () => {
  it("rejects ambient wall-clock time in shared library modules", async () => {
    const codes = await lintText(
      "src/lib/example.ts",
      [
        "/**",
        " * NEGATIVE EXAMPLE FOR LINT VERIFICATION ONLY.",
        " * Do not copy this shape into production code.",
        " */",
        "export const dehydrate = () => ({ dehydratedAt: Date.now() })",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "local-advanced/no-ambient-time")).toBe(true)
  })

  it("accepts boundary-supplied time as plain data", async () => {
    const codes = await lintText(
      "src/lib/example.ts",
      [
        "/**",
        " * Positive reference example.",
        " * This is the intended production shape.",
        " */",
        "export const dehydrate = (dehydratedAt: number) => ({ dehydratedAt })",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "local-advanced/no-ambient-time")).toBe(false)
  })

  it("rejects ambient randomness in repository modules", async () => {
    const codes = await lintText(
      "src/db/example.ts",
      [
        "/**",
        " * NEGATIVE EXAMPLE FOR LINT VERIFICATION ONLY.",
        " * Do not copy this shape into production code.",
        " */",
        "export const createTodo = () => ({ id: crypto.randomUUID() })",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "local-advanced/no-ambient-randomness")).toBe(true)
  })

  it("accepts explicit id providers in repository modules", async () => {
    const codes = await lintText(
      "src/db/example.ts",
      [
        "/**",
        " * Positive reference example.",
        " * This is the intended production shape.",
        " */",
        "export const createTodo = (nextId: () => string) => ({ id: nextId() })",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "local-advanced/no-ambient-randomness")).toBe(false)
  })

  it("rejects exported mutable bindings", async () => {
    const codes = await lintText(
      "src/lib/example.ts",
      [
        "/**",
        " * NEGATIVE EXAMPLE FOR LINT VERIFICATION ONLY.",
        " * Do not copy this shape into production code.",
        " */",
        "export let initialized = false",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "local-advanced/no-exported-mutable-bindings"))
      .toBe(true)
  })

  it("accepts immutable exports", async () => {
    const codes = await lintText(
      "src/lib/example.ts",
      [
        "/**",
        " * Positive reference example.",
        " * This is the intended production shape.",
        " */",
        "export const initialized = false",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "local-advanced/no-exported-mutable-bindings"))
      .toBe(false)
  })

  it("rejects Effect.gen orchestration in top-level route entry modules", async () => {
    const codes = await lintText(
      "src/routes/example.tsx",
      [
        "/**",
        " * NEGATIVE EXAMPLE FOR LINT VERIFICATION ONLY.",
        " * Do not copy this shape into production code.",
        " */",
        "export const loader = Effect.gen(function*() {",
        "  return []",
        "})",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "local-advanced/no-effect-gen-in-routes")).toBe(
      true,
    )
  })

  it("accepts route modules that only delegate", async () => {
    const codes = await lintText(
      "src/routes/example.tsx",
      [
        "/**",
        " * Positive reference example.",
        " * This is the intended production shape.",
        " */",
        "export const loader = loadTodosFromService",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "local-advanced/no-effect-gen-in-routes")).toBe(
      false,
    )
  })

  it("rejects projection modules that import database adapters", async () => {
    const codes = await lintText(
      "src/features/example/projections.ts",
      [
        "import { todosTable } from '@/db/schema'",
        "export const project = () => todosTable",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "local-advanced/no-feature-layer-imports")).toBe(
      true,
    )
  })

  it("accepts projection modules that only depend on domain data", async () => {
    const codes = await lintText(
      "src/features/example/projections.ts",
      [
        "import type { Todo } from '@/api/todo-schema'",
        "export const project = (todos: ReadonlyArray<Todo>) => todos.length",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "local-advanced/no-feature-layer-imports")).toBe(
      false,
    )
  })

  it("rejects direct db imports in route UI modules", async () => {
    const codes = await lintText(
      "src/routes/example.tsx",
      [
        "import { todosTable } from '@/db/schema'",
        "export const RouteView = () => todosTable",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "local-advanced/no-db-imports-in-ui")).toBe(true)
  })
})
