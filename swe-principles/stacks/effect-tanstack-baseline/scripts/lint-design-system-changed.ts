import { execSync } from "node:child_process"
import { runDesignSystemLint } from "./lint-design-system-lib"

const tryExec = (command: string): string | null => {
  try {
    return execSync(command, { encoding: "utf8" }).trim()
  } catch {
    return null
  }
}

const base = tryExec("git rev-parse --verify origin/master")
  ?? tryExec("git rev-parse --verify origin/main")
  ?? "HEAD~1"

const changed = execSync(
  `git diff ${base} --name-only --diff-filter=ACMR`,
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean)

runDesignSystemLint(changed)
