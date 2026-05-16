import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { runDesignSystemLint } from "./lint-design-system-lib"

const walk = (directory: string): Array<string> => {
  const entries = readdirSync(directory)
  return entries.flatMap((entry) => {
    const path = join(directory, entry)
    const stats = statSync(path)
    return stats.isDirectory() ? walk(path) : [path]
  })
}

const files = [
  ...walk("src/routes"),
  ...walk("src/component"),
]

runDesignSystemLint(files)
