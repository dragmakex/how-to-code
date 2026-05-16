import { buildDefaultSpecPrompt } from "./codefabrik-default-spec"

export type ValidationSection = {
  success: boolean
  errors: Array<string>
}

export type ValidationResult = {
  success: boolean
  typecheck: ValidationSection
  lint: ValidationSection
  test: ValidationSection
  build: ValidationSection
}

type CommitOutput = {
  changeId: string
  description: string
}

type DiscoverOutput = {
  done: boolean
  ticket: string
  context: string
  remainingCount: number
  remainingAreas: Array<
    "frontend" | "contracts" | "backend" | "tests" | "docs" | "env"
  >
  completionEvidence: Array<string>
  specFilesMissing: Array<string>
  journeyImpactMap: {
    ui: string
    contracts: string
    backend: string
    tests: string
  }
}

type ImplementOutput = {
  summary: string
  changes: Array<string>
  tests: Array<string>
}

type ReviewOutput = {
  approved: boolean
  issues: Array<string>
}

export type PromptContext = {
  latest(output: "discover", id: "discover"): DiscoverOutput | undefined
  latest(output: "implement", id: "implement"): ImplementOutput | undefined
  latest(output: "review", id: "review"): ReviewOutput | undefined
  latest(output: "validate", id: "validate"): ValidationResult | undefined
  outputs(output: "commit"): Array<CommitOutput> | undefined
}

type RevisionState = {
  changeId: string
  hasDescription: boolean
  isEmpty: boolean
}

/**
 * Parse jj revision state from a fixed newline-delimited template.
 * @param stdout Raw jj log output.
 * @returns Parsed revision metadata.
 */
export function parseRevisionState(stdout: string): RevisionState {
  const [changeId = "", isEmpty = "false", hasDescription = "false"] = stdout
    .split("\n")

  return {
    changeId,
    hasDescription: hasDescription === "true",
    isEmpty: isEmpty === "true",
  }
}

/**
 * Determine whether a revision is an orphaned empty transition commit.
 * @param state Parsed revision metadata.
 * @returns Whether the revision should be abandoned before commit.
 */
export function isRevisionStateEmptyUndescribed(
  state: RevisionState,
): boolean {
  return state.isEmpty && !state.hasDescription
}

const emptyValidationResult: ValidationResult = {
  success: true,
  typecheck: { success: true, errors: [] },
  lint: { success: true, errors: [] },
  test: { success: true, errors: [] },
  build: { success: true, errors: [] },
}

/**
 * Render validation failures for the fix prompt.
 * @param validation Validation result to render.
 * @returns Prompt-ready validation errors.
 */
export function formatValidationErrors(validation: ValidationResult): string {
  const sections: Array<string> = []
  if (!validation.typecheck.success) {
    sections.push(
      `## TypeScript errors\n${validation.typecheck.errors.join("\n")}`,
    )
  }
  if (!validation.lint.success) {
    sections.push(`## Lint errors\n${validation.lint.errors.join("\n")}`)
  }
  if (!validation.test.success) {
    sections.push(`## Test failures\n${validation.test.errors.join("\n")}`)
  }
  if (!validation.build.success) {
    sections.push(`## Build errors\n${validation.build.errors.join("\n")}`)
  }
  return sections.join("\n\n") || "No errors found."
}

/**
 * Build the spec section used by discovery.
 * @param spec Inline spec input.
 * @param specsPath Spec entrypoint path.
 * @param todoPath Todo path.
 * @returns Discover prompt input section.
 */
export function buildSpecSection(
  spec: string | undefined,
  specsPath: string,
  todoPath: string,
): string {
  const defaultPrompt = buildDefaultSpecPrompt(specsPath, todoPath)
  return spec
    ? `${defaultPrompt}\n\n## Additional run input\n${spec}`
    : defaultPrompt
}

/**
 * Summarize earlier commits from this run.
 * @param ctx Workflow context.
 * @returns Summary of previous commits.
 */
export function formatPreviousWork(ctx: PromptContext): string {
  const commits = ctx.outputs("commit")
  if (!commits || commits.length === 0) {
    return "No commits yet - this is the first iteration."
  }

  return commits
    .map((commit) => `- [${commit.changeId}] ${commit.description}`)
    .join("\n")
}

/**
 * Summarize the previous discovery step.
 * @param ctx Workflow context.
 * @returns Summary of the previous discovery step.
 */
export function formatPreviousDiscovery(ctx: PromptContext): string {
  const previousDiscovery = ctx.latest("discover", "discover")
  if (!previousDiscovery) {
    return "First discovery."
  }

  return `Last ticket: "${previousDiscovery.ticket}" (remaining: ${previousDiscovery.remainingCount}; areas: ${
    previousDiscovery.remainingAreas.join(", ") || "none"
  }; missing spec files: ${previousDiscovery.specFilesMissing.length})`
}

/**
 * Build the prompt for the discover task.
 * @param ctx Workflow context.
 * @param spec Inline spec input.
 * @param specsPath Spec entrypoint path.
 * @param todoPath Todo path.
 * @returns Discover-task prompt.
 */
export function buildDiscoverPrompt(
  ctx: PromptContext,
  spec: string | undefined,
  specsPath: string,
  todoPath: string,
): string {
  return `You are a spec-driven ticket decomposer.

${buildSpecSection(spec, specsPath, todoPath)}

## Context protocol

Spec comprehension (strict):
- Fully read all spec files reachable from ${specsPath} (and ${todoPath} when used as planning source).
- If a spec file is too large for one read, continue reading chunk-by-chunk (offset pagination) until EOF.
- Never emit tickets or done=true while any required spec file is only partially read.

Codebase context (targeted):
- For non-spec files, targeted snippets are allowed.
- You must still cover end-to-end user journey + task impact across:
  1) UI/user flow
  2) contracts/API boundaries
  3) backend/domain behavior
  4) tests/verification

## Your job
Identify what remains to be done and return the NEXT SINGLE ticket as a vertical slice.
A vertical slice must connect UI/user flow -> contract/API boundary -> backend/domain behavior -> tests.

If everything in the spec is already implemented, tested, and passing, set done=true.
Only set done=true when:
- remainingCount=0
- remainingAreas=[]
- specFilesMissing=[]
- completionEvidence includes concrete file-level proof for frontend, contracts, backend, and tests
- journeyImpactMap has non-empty entries for ui/contracts/backend/tests

If anything is missing in one of those areas, set done=false.

## Previous work this run
${formatPreviousWork(ctx)}

## Previous discovery
${formatPreviousDiscovery(ctx)}

Return strict JSON fields:
- done
- ticket
- context
- remainingCount
- remainingAreas
- completionEvidence
- specFilesMissing
- journeyImpactMap

When done=false: ticket must be the next smallest end-to-end slice.
When done=true: ticket should be "COMPLETE" and context should summarize why all slices are done.`
}

/**
 * Build the prompt for the implement task.
 * @param ctx Workflow context.
 * @returns Implement-task prompt.
 */
export function buildImplementPrompt(ctx: PromptContext): string {
  return `Read prompts/reviewers/TIGERSTYLE.md for code quality standards.
Read AGENTS.md for project conventions.

## Ticket
${ctx.latest("discover", "discover")?.ticket ?? "No ticket available."}

## Context
${ctx.latest("discover", "discover")?.context ?? ""}

## Previous review issues (must be addressed)
${ctx.latest("review", "review")?.issues?.join("\n") ?? "None"}

Implement this ticket as a complete vertical slice:
1) frontend/user-facing flow
2) contract/API boundary
3) backend/domain logic
4) tests that prove the whole flow

Do not stop after backend-only work.
Do not defer contracts or frontend wiring when the ticket requires them.
Keep changes minimal and focused, but complete the slice end-to-end.
If already implemented, report a no-op with evidence.`
}

/**
 * Build the prompt for the review task.
 * @param ctx Workflow context.
 * @returns Review-task prompt.
 */
export function buildReviewPrompt(ctx: PromptContext): string {
  return `Review the implementation of this ticket against prompts/reviewers/TIGERSTYLE.md and AGENTS.md.

## Ticket
${ctx.latest("discover", "discover")?.ticket ?? ""}

## Implementation summary
${ctx.latest("implement", "implement")?.summary ?? "No implementation summary."}

## Changes
${ctx.latest("implement", "implement")?.changes?.join("\n") ?? "None"}

## Tests
${ctx.latest("implement", "implement")?.tests?.join("\n") ?? "None"}

Reject partial slices.
Return approved=true only if the ticket is complete end-to-end:
- frontend/user flow addressed
- contract/API boundary updated or confirmed
- backend/domain behavior implemented
- tests cover the integrated flow

If issues found, list concrete missing parts.`
}

/**
 * Build the prompt for the fix task.
 * @param ctx Workflow context.
 * @returns Fix-task prompt.
 */
export function buildFixPrompt(ctx: PromptContext): string {
  const validation = ctx.latest("validate", "validate") ?? emptyValidationResult
  return `Validation failed and/or review found issues after implementing this ticket. Fix the errors and address any review issues.
Do NOT disable lint rules, skip tests, or use \`any\`. Fix root causes.
Do not leave the ticket partially done: keep the vertical slice end-to-end (frontend + contracts + backend + tests).

## Ticket that was implemented
${ctx.latest("discover", "discover")?.ticket ?? ""}

## Review issues
${ctx.latest("review", "review")?.issues?.join("\n") ?? "None"}

## Validation errors
${formatValidationErrors(validation)}`
}
