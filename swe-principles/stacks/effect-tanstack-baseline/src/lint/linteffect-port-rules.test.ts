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

const writeFixture = (filePath: string, source: string): string => {
  const directory = mkdtempSync(join(cwd(), ".tmp-linteffect-port-lint-"))
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

const hasRule = (codes: ReadonlyArray<string>, ruleId: string): boolean => {
  const oxlintCode = ruleId.replace("/", "(") + ")"

  return codes.some((code) =>
    code.includes(ruleId) || code.includes(oxlintCode)
  )
}

describe("linteffect port rules", () => {
  it("rejects Effect.as", async () => {
    const codes = await lintText(
      "src/lib/example.ts",
      [
        "import { Effect } from 'effect'",
        "export const x = Effect.succeed(1).pipe(Effect.as(2))",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "linteffect-port/no-effect-as")).toBe(true)
  })

  it("rejects Effect.bind", async () => {
    const codes = await lintText(
      "src/lib/example.ts",
      [
        "import { Effect } from 'effect'",
        "export const x = Effect.bind('value', Effect.succeed(1))",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "linteffect-port/no-effect-bind")).toBe(true)
  })

  it("rejects Runtime.runFork", async () => {
    const codes = await lintText(
      "src/lib/example.ts",
      [
        "import { Effect, Runtime } from 'effect'",
        "declare const runtime: Runtime.Runtime<never>",
        "export const x = Runtime.runFork(runtime)(Effect.void)",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "linteffect-port/no-runtime-runfork")).toBe(true)
  })

  it("rejects sequential side effects hidden in Effect.all", async () => {
    const codes = await lintText(
      "src/lib/example.ts",
      [
        "import { Effect, Ref } from 'effect'",
        "declare const statusRef: Ref.Ref<string>",
        "export const x = Effect.all([Ref.set(statusRef, 'loading')], { concurrency: 1 })",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "linteffect-port/no-effect-all-step-sequencing"))
      .toBe(true)
  })

  it("does not flag a single top-level Effect.gen", async () => {
    const codes = await lintText(
      "src/lib/example.ts",
      [
        "import { Effect } from 'effect'",
        "export const x = Effect.gen(function*() {",
        "  yield* Effect.void",
        "})",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "linteffect-port/no-nested-effect-gen")).toBe(false)
  })

  it("flags nested Effect.gen inside another generator", async () => {
    const codes = await lintText(
      "src/lib/example.ts",
      [
        "import { Effect } from 'effect'",
        "export const x = Effect.gen(function*() {",
        "  return yield* Effect.gen(function*() {",
        "    return 1",
        "  })",
        "})",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "linteffect-port/no-nested-effect-gen")).toBe(true)
  })

  it("allows dynamic imports in test files", async () => {
    const codes = await lintText(
      "src/lib/example.test.ts",
      [
        "export const x = async () => import('./lazy-module')",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "linteffect-port/prevent-dynamic-imports")).toBe(
      false,
    )
  })

  it("rejects dynamic imports in production files", async () => {
    const codes = await lintText(
      "src/lib/example.ts",
      [
        "export const x = async () => import('./lazy-module')",
      ]
        .join("\n"),
    )

    expect(hasRule(codes, "linteffect-port/prevent-dynamic-imports")).toBe(
      true,
    )
  })
})
