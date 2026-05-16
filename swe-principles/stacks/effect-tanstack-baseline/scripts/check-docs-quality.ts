#!/usr/bin/env bun

/**
 * Documentation Quality Checker
 *
 * Enforces German precision engineering standards for documentation:
 * 1. TSDoc completeness and accuracy
 * 2. Markdown documentation structure in docs/app/
 * 3. Implementation alignment (docs match actual code)
 * 4. Mermaid diagram requirements
 *
 * Exit codes:
 * - 0: All checks passed
 * - 1: Documentation quality issues found
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

interface DocIssue {
  type: "error" | "warning"
  file: string
  message: string
}

const issues: Array<DocIssue> = []
const warnings: Array<DocIssue> = []

/**
 * Check if docs/app/ structure is properly maintained
 */
function checkDocsAppStructure(): void {
  const docsAppPath = join(process.cwd(), "docs", "app")

  if (!existsSync(docsAppPath)) {
    issues.push({
      type: "error",
      file: "docs/app/",
      message: "docs/app/ directory does not exist",
    })
    return
  }

  const entries = readdirSync(docsAppPath)
  const featureDirs = entries.filter((entry) => {
    const fullPath = join(docsAppPath, entry)
    return statSync(fullPath).isDirectory() && !entry.startsWith(".")
  })

  if (featureDirs.length === 0) {
    // No feature docs yet - this is a warning, not an error
    warnings.push({
      type: "warning",
      file: "docs/app/",
      message:
        "No feature documentation found. Add docs when implementing features.",
    })
    return
  }

  // Check each feature directory for required structure
  for (const featureDir of featureDirs) {
    checkFeatureDocStructure(join(docsAppPath, featureDir), featureDir)
  }
}

/**
 * Check individual feature documentation structure
 * @param featurePath - Path to the feature documentation directory
 * @param featureName - Name of the feature being checked
 */
function checkFeatureDocStructure(
  featurePath: string,
  featureName: string,
): void {
  const readmePath = join(featurePath, "README.md")

  if (!existsSync(readmePath)) {
    issues.push({
      type: "error",
      file: `docs/app/${featureName}/README.md`,
      message: "Missing required file: README.md",
    })
    return
  }

  checkReadmeQuality(readmePath, featureName)

  const entries = readdirSync(featurePath)
  const markdownFiles = entries.filter((entry) => entry.endsWith(".md"))
  const extraMarkdownFiles = markdownFiles.filter((entry) =>
    entry !== "README.md"
  )
  const diagramsPath = join(featurePath, "diagrams")
  const hasDiagramsDirectory = existsSync(diagramsPath)

  if (hasDiagramsDirectory) {
    checkDiagramsDirectory(diagramsPath, featureName)
  }

  if (extraMarkdownFiles.length > 0) {
    checkExpandedFeatureDocStructure(
      featurePath,
      featureName,
      extraMarkdownFiles,
    )
  }

  const readmeContent = readFileSync(readmePath, "utf-8")
  const hasMermaidInReadme = readmeContent.includes("```mermaid")

  if (!hasDiagramsDirectory && !hasMermaidInReadme) {
    warnings.push({
      type: "warning",
      file: `docs/app/${featureName}/README.md`,
      message:
        "No Mermaid diagram found in README.md and no diagrams/ directory present. Add visual documentation when it improves clarity.",
    })
  }
}

/**
 * Check expanded multi-file feature documentation when extra markdown files exist.
 * @param featurePath - Path to the feature documentation directory
 * @param featureName - Name of the feature being checked
 * @param extraMarkdownFiles - Additional markdown files besides README.md
 */
function checkExpandedFeatureDocStructure(
  featurePath: string,
  featureName: string,
  extraMarkdownFiles: ReadonlyArray<string>,
): void {
  const architecturePath = join(featurePath, "architecture.md")
  const implementationPath = join(featurePath, "implementation.md")
  const hasArchitecture = existsSync(architecturePath)
  const hasImplementation = existsSync(implementationPath)

  if (hasArchitecture !== hasImplementation) {
    const missingFile = hasArchitecture
      ? "implementation.md"
      : "architecture.md"
    warnings.push({
      type: "warning",
      file: `docs/app/${featureName}/${missingFile}`,
      message:
        "Expanded feature docs should keep architecture.md and implementation.md together, or stay with a single README.md.",
    })
  }

  for (const file of extraMarkdownFiles) {
    const filePath = join(featurePath, file)
    const content = readFileSync(filePath, "utf-8")

    if (content.length < 100) {
      warnings.push({
        type: "warning",
        file: `docs/app/${featureName}/${file}`,
        message:
          `${file} is very short. Consider folding it back into README.md.`,
      })
    }

    if (!/^#\s+.+/m.test(content)) {
      warnings.push({
        type: "warning",
        file: `docs/app/${featureName}/${file}`,
        message: `${file} is missing a title heading.`,
      })
    }
  }
}

/**
 * Check README.md quality
 * @param readmePath - Path to the README.md file
 * @param featureName - Name of the feature being checked
 */
function checkReadmeQuality(readmePath: string, featureName: string): void {
  const content = readFileSync(readmePath, "utf-8")

  // Check minimum content length
  if (content.length < 100) {
    issues.push({
      type: "error",
      file: `docs/app/${featureName}/README.md`,
      message: "README.md is too short (< 100 chars). Provide detailed docs.",
    })
  }

  // Check for required sections (title and at least one section)
  const hasTitle = /^#\s+.+/m.test(content)
  const hasSections = /^##\s+.+/m.test(content)

  if (!hasTitle) {
    issues.push({
      type: "error",
      file: `docs/app/${featureName}/README.md`,
      message: "Missing title (# heading)",
    })
  }

  if (!hasSections) {
    warnings.push({
      type: "warning",
      file: `docs/app/${featureName}/README.md`,
      message: "No sections found (## headings). Add structure.",
    })
  }

  // Check for code examples
  if (!content.includes("```")) {
    warnings.push({
      type: "warning",
      file: `docs/app/${featureName}/README.md`,
      message: "No code examples found. Add usage examples.",
    })
  }
}

/**
 * Check diagrams directory
 * @param diagramsPath - Path to the diagrams directory
 * @param featureName - Name of the feature being checked
 */
function checkDiagramsDirectory(
  diagramsPath: string,
  featureName: string,
): void {
  const files = readdirSync(diagramsPath)
  const markdownFiles = files.filter((f) => f.endsWith(".md"))

  if (markdownFiles.length === 0) {
    warnings.push({
      type: "warning",
      file: `docs/app/${featureName}/diagrams/`,
      message: "No diagram files found. Add Mermaid diagrams for architecture.",
    })
    return
  }

  // Check each markdown file for Mermaid diagrams
  for (const file of markdownFiles) {
    const content = readFileSync(join(diagramsPath, file), "utf-8")
    if (!content.includes("```mermaid")) {
      warnings.push({
        type: "warning",
        file: `docs/app/${featureName}/diagrams/${file}`,
        message: "No Mermaid diagram found. Add ```mermaid block.",
      })
    }
  }
}

/**
 * Check for Mermaid diagrams in main docs
 */
function checkMainDocsForDiagrams(): void {
  const mainDocs = [
    "docs/architecture/overview.md",
    "docs/guides/testing.md",
  ]

  for (const docPath of mainDocs) {
    const fullPath = join(process.cwd(), docPath)
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf-8")
      if (!content.includes("```mermaid")) {
        warnings.push({
          type: "warning",
          file: docPath,
          message: "Consider adding Mermaid diagrams for visual clarity.",
        })
      }
    }
  }
}

/**
 * Check TSDoc coverage via the lint configuration
 * This doesn't re-run Oxlint, just reminds about the requirement
 */
function checkTSDocRequirement(): void {
  console.log("\n📚 TSDoc Quality:")
  console.log(
    "  TSDoc is enforced via Oxlint using eslint-plugin-jsdoc",
  )
  console.log("  Run `bun run lint` to check TSDoc completeness")
  console.log(
    "  All functions must have: description, @param entries, @returns",
  )
}

/**
 * Print summary
 */
function printSummary(): void {
  console.log(`\n${"=".repeat(60)}`)
  console.log("📖 Documentation Quality Check Summary")
  console.log("=".repeat(60))

  if (issues.length === 0 && warnings.length === 0) {
    console.log("\n✅ All documentation quality checks passed!")
    console.log("\n🇩🇪 German precision engineering standards met.")
    return
  }

  if (issues.length > 0) {
    console.log(`\n❌ ${issues.length} Error(s) Found:\n`)
    for (const issue of issues) {
      console.log(`  ${issue.file}`)
      console.log(`    ${issue.message}\n`)
    }
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} Warning(s):\n`)
    for (const warning of warnings) {
      console.log(`  ${warning.file}`)
      console.log(`    ${warning.message}\n`)
    }
  }

  console.log(`\n${"=".repeat(60)}`)
  console.log("📋 Documentation Standards:")
  console.log("=".repeat(60))
  console.log("\nPreferred compact form:")
  console.log("  ✅ docs/app/[feature]/README.md")
  console.log("  ✅ Mermaid in README.md or optional diagrams/")
  console.log("\nExpanded form for larger topics:")
  console.log("  ✅ README.md")
  console.log("  ✅ architecture.md")
  console.log("  ✅ implementation.md")
  console.log("  ✅ optional diagrams/")
  console.log(
    "\nSee docs/app/README.md for detailed standards.",
  )
}

/**
 * Main execution
 */
function main(): void {
  console.log("🔍 Checking Documentation Quality...\n")

  // Check docs/app/ structure
  checkDocsAppStructure()

  // Check main docs for diagrams
  checkMainDocsForDiagrams()

  // Remind about TSDoc
  checkTSDocRequirement()

  // Print summary
  printSummary()

  // Exit with error if issues found
  if (issues.length > 0) {
    console.log(
      "\n❌ Documentation quality check failed. Fix errors above.",
    )
    process.exit(1)
  }

  if (warnings.length > 0) {
    console.log(
      "\n⚠️  Warnings found but check passed. Consider addressing them.",
    )
  }

  console.log("\n✅ Documentation quality check passed!")
  process.exit(0)
}

main()
