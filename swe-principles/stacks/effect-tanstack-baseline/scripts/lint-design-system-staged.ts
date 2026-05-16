import { execSync } from "node:child_process"
import { runDesignSystemLint } from "./lint-design-system-lib"

const staged = execSync("git diff --cached --name-only --diff-filter=ACMR", {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean)

runDesignSystemLint(staged)
