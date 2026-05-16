/* @jsxImportSource smithers-orchestrator */
import { $ } from "bun"
import {
  CodexAgent,
  createSmithers,
  Ralph,
  Sequence,
  Task,
  Workflow,
} from "smithers-orchestrator"
import { z } from "zod"

import {
  buildDiscoverPrompt,
  buildFixPrompt,
  buildImplementPrompt,
  buildReviewPrompt,
  isRevisionStateEmptyUndescribed,
  parseRevisionState,
  type PromptContext,
  type ValidationResult,
  type ValidationSection,
} from "./codefabrik-prompts"

const repoRoot = process.cwd()
const codexLbBaseUrl = (process.env.CODEX_LB_BASE_URL?.trim()
  || "http://codex-lb.codex-lb.svc.cluster.local:2455")
  .replace(/\/$/, "")
const codexModel = process.env.CODEX_MODEL?.trim() || "gpt-5.3-codex"

if (!process.env.CODEX_LB_API_KEY?.trim()) {
  throw new Error(
    "Missing CODEX_LB_API_KEY. Provide codex-lb key via --env-file or project env.",
  )
}

type ShellResult = {
  stdout: string
  stderr: string
  exitCode: number
}

type RevisionState = {
  changeId: string
  hasDescription: boolean
  isEmpty: boolean
}

/**
 * Run a shell command and capture the result.
 * @param command Raw shell command.
 * @param cwd Working directory.
 * @returns Captured shell result.
 */
async function shell(command: string, cwd = repoRoot): Promise<ShellResult> {
  const result = await $`${{ raw: command }}`.cwd(cwd).nothrow().quiet()
  return {
    stdout: result.stdout.toString().trim(),
    stderr: result.stderr.toString().trim(),
    exitCode: result.exitCode,
  }
}

/**
 * Run a shell command and throw if it fails.
 * @param command Raw shell command.
 * @param cwd Working directory.
 * @returns Captured shell result.
 */
async function shellOrThrow(
  command: string,
  cwd = repoRoot,
): Promise<ShellResult> {
  const result = await shell(command, cwd)
  if (result.exitCode !== 0) {
    throw new Error(
      `Command failed (exit ${result.exitCode}): ${command}\n${
        result.stderr || result.stdout
      }`,
    )
  }
  return result
}

/**
 * Read the current jj revision state.
 * @returns Current revision metadata.
 */
async function getCurrentRevisionState(): Promise<RevisionState> {
  const result = await shellOrThrow(
    String
      .raw`jj log -r @ --no-graph -T 'change_id ++ "\n" ++ if(empty, "true", "false") ++ "\n" ++ if(description, "true", "false")'`,
  )
  return parseRevisionState(result.stdout)
}

/**
 * Determine whether the current revision is an orphaned empty transition.
 * @returns Whether the current revision should be abandoned before commit.
 */
async function isCurrentRevisionEmptyUndescribed(): Promise<boolean> {
  const current = await getCurrentRevisionState()
  return isRevisionStateEmptyUndescribed(current)
}

/**
 * Abandon a stray empty revision left behind by an interrupted workflow run.
 */
async function abandonOrphanedEmptyRevision(): Promise<void> {
  if (!(await isCurrentRevisionEmptyUndescribed())) {
    return
  }

  await shellOrThrow("jj abandon @")
}

/**
 * Filter one validation command into a bounded error section.
 * @param result Command result to inspect.
 * @param filter Error-line filter.
 * @returns Filtered validation section.
 */
function collectValidationSection(
  result: ShellResult,
  filter: (line: string) => boolean,
): ValidationSection {
  return {
    success: result.exitCode === 0,
    errors: result.exitCode !== 0
      ? (result.stderr || result.stdout).split("\n").filter(filter).slice(0, 50)
      : [],
  }
}

/**
 * Run validation for one workflow iteration.
 * @returns Aggregated validation results.
 */
async function runValidation(): Promise<ValidationResult> {
  const typecheck = await shell("bun run typecheck")
  const lint = await shell("bun run lint")
  const test = await shell("bun run test:coverage")
  const build = await shell("bun run build")

  const tc = collectValidationSection(
    typecheck,
    (line) => line.includes("error TS"),
  )
  const lt = collectValidationSection(lint, (line) => line.trim().length > 0)
  const ts = collectValidationSection(
    test,
    (line) =>
      line.includes("FAIL") || line.includes("✗") || line
        .includes("×") || line
        .includes("Error"),
  )
  const bd = collectValidationSection(build, (line) => line.trim().length > 0)

  return {
    success: tc.success && lt.success && ts.success && bd.success,
    typecheck: tc,
    lint: lt,
    test: ts,
    build: bd,
  }
}

const branchSchema = z.object({
  branch: z.string(),
  basedOn: z.string(),
  createdAt: z.string(),
})

const discoverSchema = z
  .object({
    done: z.boolean(),
    ticket: z.string(),
    context: z.string(),
    remainingCount: z.number().int().nonnegative(),
    remainingAreas: z.array(
      z.enum(["frontend", "contracts", "backend", "tests", "docs", "env"]),
    ),
    completionEvidence: z.array(z.string()),
    specFilesMissing: z.array(z.string()),
    journeyImpactMap: z.object({
      ui: z.string(),
      contracts: z.string(),
      backend: z.string(),
      tests: z.string(),
    }),
  })
  .superRefine((value, issue) => {
    if (value.done) {
      if (value.remainingCount !== 0) {
        issue.addIssue({
          code: z.ZodIssueCode.custom,
          message: "done=true requires remainingCount=0",
          path: ["remainingCount"],
        })
      }
      if (value.remainingAreas.length > 0) {
        issue.addIssue({
          code: z.ZodIssueCode.custom,
          message: "done=true requires remainingAreas=[]",
          path: ["remainingAreas"],
        })
      }
      if (value.completionEvidence.length === 0) {
        issue.addIssue({
          code: z.ZodIssueCode.custom,
          message: "done=true requires non-empty completionEvidence",
          path: ["completionEvidence"],
        })
      }
      if (value.specFilesMissing.length > 0) {
        issue.addIssue({
          code: z.ZodIssueCode.custom,
          message: "done=true requires specFilesMissing=[]",
          path: ["specFilesMissing"],
        })
      }
      if (!value.journeyImpactMap.ui.trim().length) {
        issue.addIssue({
          code: z.ZodIssueCode.custom,
          message: "done=true requires non-empty journeyImpactMap.ui",
          path: ["journeyImpactMap", "ui"],
        })
      }
      if (!value.journeyImpactMap.contracts.trim().length) {
        issue.addIssue({
          code: z.ZodIssueCode.custom,
          message: "done=true requires non-empty journeyImpactMap.contracts",
          path: ["journeyImpactMap", "contracts"],
        })
      }
      if (!value.journeyImpactMap.backend.trim().length) {
        issue.addIssue({
          code: z.ZodIssueCode.custom,
          message: "done=true requires non-empty journeyImpactMap.backend",
          path: ["journeyImpactMap", "backend"],
        })
      }
      if (!value.journeyImpactMap.tests.trim().length) {
        issue.addIssue({
          code: z.ZodIssueCode.custom,
          message: "done=true requires non-empty journeyImpactMap.tests",
          path: ["journeyImpactMap", "tests"],
        })
      }
    }
  })

const implementSchema = z.object({
  summary: z.string(),
  changes: z.array(z.string()).min(1),
  tests: z.array(z.string()),
})

const reviewSchema = z.object({
  approved: z.boolean(),
  issues: z.array(z.string()),
})

const validateSchema = z.object({
  success: z.boolean(),
  typecheck: z.object({ success: z.boolean(), errors: z.array(z.string()) }),
  lint: z.object({ success: z.boolean(), errors: z.array(z.string()) }),
  test: z.object({ success: z.boolean(), errors: z.array(z.string()) }),
  build: z.object({ success: z.boolean(), errors: z.array(z.string()) }),
})

const fixSchema = z.object({
  summary: z.string(),
  fixes: z.array(z.string()),
})

const commitSchema = z.object({
  changeId: z.string(),
  description: z.string(),
})

const pushSchema = z.object({
  branch: z.string(),
  remote: z.string(),
})

// ── Smithers setup ──

const { outputs, smithers } = createSmithers(
  {
    branch: branchSchema,
    discover: discoverSchema,
    implement: implementSchema,
    review: reviewSchema,
    validate: validateSchema,
    fix: fixSchema,
    commit: commitSchema,
    push: pushSchema,
  },
  { dbPath: "./workflows/codefabrik.db" },
)

const codex = new CodexAgent({
  cd: repoRoot,
  env: {
    CODEX_LB_API_KEY: process.env.CODEX_LB_API_KEY,
  },
  sandbox: "workspace-write",
  // Timeouts: hard limit 4 hours, idle limit 5 minutes (catches hung API calls)
  timeoutMs: 14_400_000,
  idleTimeoutMs: 300_000,
  config: [
    `model=${codexModel}`,
    "model_provider=codex-lb",
    "model_providers.codex-lb.name=OpenAI",
    `model_providers.codex-lb.base_url=${codexLbBaseUrl}/backend-api/codex`,
    "model_providers.codex-lb.wire_api=responses",
    "model_providers.codex-lb.env_key=CODEX_LB_API_KEY",
    "model_providers.codex-lb.supports_websockets=true",
    "model_providers.codex-lb.requires_openai_auth=true",
    "mcp_servers.playwright.env.NPM_CONFIG_CACHE=/tmp/npm-cache",
  ],
})
type WorkflowContext =
  & Parameters<Parameters<typeof smithers>[0]>[0]
  & PromptContext

/**
 * Create the workflow bookmark from the correct base revision.
 * @param branchName Optional bookmark name.
 * @returns Created branch metadata.
 */
async function createBranch(branchName: string | undefined) {
  const branch = branchName ?? `codefabrik/${Date.now()}`
  const current = await shellOrThrow(
    String
      .raw`jj log -r @ --no-graph -T 'change_id ++ "\n" ++ if(empty, "true", "false")'`,
  )
  const [currentChangeId = "", currentEmpty] = current.stdout.split("\n")
  const baseRevision = currentEmpty === "true" ? "@-" : "@"
  const base = currentEmpty === "true"
    ? await shellOrThrow("jj log -r @- --no-graph -T change_id")
    : { ...current, stdout: currentChangeId || current.stdout }

  await shellOrThrow(
    `jj new ${baseRevision} -m ${$.escape(`wip: ${branch}`)}`,
  )

  const bookmark = await shell(`jj bookmark set ${$.escape(branch)} -r @`)
  if (bookmark.exitCode !== 0) {
    console.warn(`jj bookmark set warning: ${bookmark.stderr}`)
  }

  return {
    branch,
    basedOn: base.stdout,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Commit the finished slice and reopen an empty change.
 * @param ctx Workflow context.
 * @returns Commit metadata for the finished slice.
 */
async function createCommit(ctx: WorkflowContext) {
  const ticket = ctx.latest("discover", "discover")?.ticket ?? "work"
  const description = `feat: ${ticket}`
  const branch = ctx.latest("branch", "branch")?.branch
  if (!branch) {
    throw new Error("Missing workflow branch output.")
  }

  await abandonOrphanedEmptyRevision()
  await shellOrThrow(`jj describe -m ${$.escape(description)}`)
  const current = await getCurrentRevisionState()
  const changeId = current.changeId

  await shellOrThrow(`jj bookmark set ${$.escape(branch)} -r @`)
  await shellOrThrow("jj new")

  return { changeId, description }
}

/**
 * Push the current workflow bookmark to origin.
 * @param ctx Workflow context.
 * @returns Push metadata for the current bookmark.
 */
async function pushBookmark(ctx: WorkflowContext) {
  const branch = ctx.latest("branch", "branch")?.branch
  if (!branch) {
    throw new Error("Missing workflow branch output.")
  }

  const remote = "origin"
  await shellOrThrow(
    `jj --ignore-working-copy git push --allow-empty-description --remote ${
      $.escape(remote)
    } --bookmark ${$.escape(branch)}`,
  )

  return { branch, remote }
}

type DiscoverResult = z.infer<typeof discoverSchema>

/**
 * Determine whether discovery has provided complete completion evidence.
 * @param discover Latest discover output.
 * @returns Whether discovery satisfies all completion preconditions.
 */
function isDiscoverComplete(discover: DiscoverResult | undefined): boolean {
  if (!discover || !discover.done) {
    return false
  }

  return discover.remainingCount === 0
    && discover.remainingAreas.length === 0
    && discover.completionEvidence.length > 0
    && discover.specFilesMissing.length === 0
    && discover.journeyImpactMap.ui.trim().length > 0
    && discover.journeyImpactMap.contracts.trim().length > 0
    && discover.journeyImpactMap.backend.trim().length > 0
    && discover.journeyImpactMap.tests.trim().length > 0
}

/**
 * Render the Smithers workflow.
 * @param ctx Workflow context.
 * @param branchName Optional bookmark name.
 * @param spec Inline spec input.
 * @param specsPath Spec entrypoint path.
 * @param todoPath Todo path.
 * @returns Workflow JSX.
 */
function renderWorkflow(
  ctx: WorkflowContext,
  branchName: string | undefined,
  spec: string | undefined,
  specsPath: string,
  todoPath: string,
) {
  const discover = ctx.latest("discover", "discover")
  const discoverComplete = isDiscoverComplete(discover)
  const validationSucceeded =
    ctx.latest("validate", "validate")?.success === true
  const reviewApproved = ctx.latest("review", "review")?.approved === true
  const done = discoverComplete && validationSucceeded && reviewApproved

  return (
    <Workflow name="codefabrik">
      <Sequence>
        <Task id="branch" output={outputs.branch}>
          {async () => createBranch(branchName)}
        </Task>
        <Ralph
          until={done}
          maxIterations={20}
          onMaxReached="return-last"
        >
          <Sequence>
            <Task id="discover" output={outputs.discover} agent={codex}>
              {buildDiscoverPrompt(ctx, spec, specsPath, todoPath)}
            </Task>
            <Task
              id="implement"
              output={outputs.implement}
              agent={codex}
              skipIf={done}
            >
              {buildImplementPrompt(ctx)}
            </Task>
            <Task
              id="review"
              output={outputs.review}
              agent={codex}
              skipIf={done}
            >
              {buildReviewPrompt(ctx)}
            </Task>
            <Task
              id="validate"
              output={outputs.validate}
              skipIf={done}
            >
              {async () => runValidation()}
            </Task>
            <Task
              id="fix"
              output={outputs.fix}
              agent={codex}
              skipIf={done || (validationSucceeded && reviewApproved)}
            >
              {buildFixPrompt(ctx)}
            </Task>
            <Task
              id="commit"
              output={outputs.commit}
              skipIf={done || !validationSucceeded || !reviewApproved}
            >
              {async () => createCommit(ctx)}
            </Task>
            <Task
              id="push"
              output={outputs.push}
              skipIf={done || !validationSucceeded || !reviewApproved}
            >
              {async () => pushBookmark(ctx)}
            </Task>
          </Sequence>
        </Ralph>
      </Sequence>
    </Workflow>
  )
}

export default smithers((ctx) => {
  const input = (ctx.input ?? {}) as Record<string, unknown>
  const branchName = input.branch as string | undefined
  const spec = input.spec as string | undefined
  const specsPath = (input.specsPath as string | undefined) ?? "specs/README.md"
  const todoPath = (input.todoPath as string | undefined) ?? "todo.md"

  return renderWorkflow(ctx, branchName, spec, specsPath, todoPath)
})
