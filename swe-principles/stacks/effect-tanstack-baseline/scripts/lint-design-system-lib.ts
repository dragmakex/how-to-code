import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { cwd, exit } from "node:process"

type DesignSystemViolation = {
  readonly file: string
  readonly line: number
  readonly message: string
  readonly snippet: string
}

const targetFilePattern = /^src\/(routes|component)\/.*\.(ts|tsx)$/

/**
 * Matches `className=` or `className={` attribute usage in JSX.
 *
 * Application code must not apply CSS classes directly.
 * All visual styling flows through design-system components that
 * expose typed props instead of className.
 */
const classNamePattern = /\bclassName[={]/

/**
 * Matches `style=` or `style={` attribute usage in JSX.
 */
const stylePattern = /\bstyle[={]/

/**
 * Matches route-local styled native form controls.
 * The pattern catches native elements that receive className or style.
 */
const styledNativeControlPattern =
  /<(button|input|select|textarea)\b[^>]*(?:className|style)=/

const exceptionPattern = /ds-exception:\s+.+/

const toLineNumber = (source: string, offset: number): number =>
  source.slice(0, offset).split("\n").length

const hasDocumentedException = (
  source: string,
  lineNumber: number,
): boolean => {
  const lines = source.split("\n")
  const currentLine = lines[lineNumber - 1] ?? ""
  const previousLine = lines[lineNumber - 2] ?? ""

  return exceptionPattern.test(currentLine)
    || exceptionPattern.test(previousLine)
}

const collectViolationsForPattern = (
  source: string,
  file: string,
  pattern: RegExp,
  message: string,
): Array<DesignSystemViolation> => {
  const violations: Array<DesignSystemViolation> = []
  const matches = source.matchAll(new RegExp(pattern, "g"))

  for (const match of matches) {
    const start = match.index ?? 0
    const lineNumber = toLineNumber(source, start)
    const snippet = source.split("\n")[lineNumber - 1] ?? ""

    if (hasDocumentedException(source, lineNumber)) {
      continue
    }

    violations.push({
      file,
      line: lineNumber,
      message,
      snippet: snippet.trim(),
    })
  }

  return violations
}

/**
 * Lints a set of UI source files against the design-system contract.
 *
 * The contract is simple: application code composes design-system components.
 * It does not use className, style, or raw styled native controls.
 *
 * @param files - Candidate file paths to lint.
 * @returns An array of violations.
 */
export function lintDesignSystem(
  files: ReadonlyArray<string>,
): Array<DesignSystemViolation> {
  const violations: Array<DesignSystemViolation> = []

  for (const file of files) {
    const relativePath = relative(cwd(), file)
    if (!targetFilePattern.test(relativePath)) {
      continue
    }

    const source = readFileSync(file, "utf8")
    const fileViolations = [
      ...collectViolationsForPattern(
        source,
        relativePath,
        classNamePattern,
        "Application code must not use className. Compose design-system components with typed props instead.",
      ),
      ...collectViolationsForPattern(
        source,
        relativePath,
        stylePattern,
        "Application code must not use inline style. Compose design-system components with typed props instead.",
      ),
      ...collectViolationsForPattern(
        source,
        relativePath,
        styledNativeControlPattern,
        "Use design-system control components instead of route-local styled native controls.",
      ),
    ]
    for (const violation of fileViolations) {
      violations.push(violation)
    }
  }

  return violations
}

// ---------------------------------------------------------------------------
// Registry enforcement
// ---------------------------------------------------------------------------

const dsRoot = "src/design-system"

const walkDirectory = (directory: string): Array<string> => {
  const entries = readdirSync(directory)
  return entries.flatMap((entry) => {
    const path = join(directory, entry)
    return statSync(path).isDirectory() ? walkDirectory(path) : [path]
  })
}

/**
 * Checks that every file under `src/design-system/` is listed in the
 * component registry. Unregistered files indicate a component was added
 * without going through the decision framework.
 *
 * @returns An array of unregistered file paths relative to `src/design-system/`.
 */
export function findUnregisteredComponents(): Array<string> {
  const registrySource = readFileSync(
    join(cwd(), dsRoot, "registry.ts"),
    "utf8",
  )

  const allFiles = walkDirectory(join(cwd(), dsRoot))
  const unregistered: Array<string> = []

  for (const absolutePath of allFiles) {
    const relativePath = relative(join(cwd(), dsRoot), absolutePath)

    // Check if this file path appears as a key in the registry source.
    // This is intentionally simple: the path string must appear in registry.ts.
    if (!registrySource.includes(`"${relativePath}"`)) {
      unregistered.push(relativePath)
    }
  }

  return unregistered
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

/**
 * Prints violations and exits with a non-zero code when the contract is broken.
 *
 * @param files - Candidate file paths to lint.
 */
export function runDesignSystemLint(files: ReadonlyArray<string>) {
  const violations = lintDesignSystem(files)
  const unregistered = findUnregisteredComponents()

  let failed = false

  if (violations.length > 0) {
    failed = true
    console.error("❌ Design-system contract violations:\n")
    for (const violation of violations) {
      console.error(`${violation.file}:${violation.line}`)
      console.error(`  ${violation.message}`)
      console.error(`  ${violation.snippet}`)
      console.error("")
    }
  }

  if (unregistered.length > 0) {
    failed = true
    console.error("❌ Unregistered design-system files:\n")
    for (const file of unregistered) {
      console.error(`  src/design-system/${file}`)
    }
    console.error("")
    console.error(
      "Every file under src/design-system/ must be registered in",
    )
    console.error(
      "src/design-system/registry.ts with a justification.",
    )
    console.error(
      "Apply the decision framework in docs/design-system/rules.md",
    )
    console.error(
      "before adding new components.\n",
    )
  }

  if (failed) {
    exit(1)
  }

  console.log("✅ Design-system contract passed")
}
