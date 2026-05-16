# Workflow Templates

## `codefabrik.tsx`

`codefabrik.tsx` is the baseline Smithers workflow template for running a
spec-driven implementation loop on a dedicated jj bookmark.

The workflow now enforces this task order inside an inner `Sequence` within
`Ralph`:

1. `discover`
2. `implement`
3. `review`
4. `validate`
5. `fix`
6. `commit`
7. `push`

That sequencing matters because `discover` must finish before later tasks begin.
Without the inner `Sequence`, Smithers can mount tasks concurrently and race
`implement` or `review` ahead of discovery.

## Inputs

The workflow accepts these run inputs:

- `branch`: bookmark name for the run
- `todoPath`: path to the backlog document, default `todo.md`
- `specsPath`: path to the spec entrypoint, default `specs/README.md`
- `spec`: optional inline run-specific instruction appended to the default prompt

The default discover prompt is generic. It tells the agent to:

- read `specsPath`
- read `todoPath`
- choose the next best vertical slice
- execute TDD end to end
- commit on the workflow bookmark selected for the run

## Bookmark And Push Behavior

The template creates the workflow change from the correct jj base:

- if the current `@` is empty, it branches from `@-`
- otherwise it branches from `@`

That avoids inheriting useless empty scratch ancestry into new workflow
bookmarks.

When a slice is ready, the template:

1. abandons `@` if it is an empty, undescribed orphan left by a prior interrupted run
2. runs `jj describe -m ...`
3. captures the finished change id
4. moves the workflow bookmark to `@`
5. opens a fresh empty change with `jj new`

The bookmark move must happen before `jj new`, otherwise the bookmark points at
the new empty working copy instead of the finished slice.

Publishing uses:

```bash
jj --ignore-working-copy git push --allow-empty-description --remote origin --bookmark <branch>
```

`--ignore-working-copy` ensures the push targets the finished bookmarked slice
instead of the fresh empty `@`. The commit step also abandons orphaned empty
undescribed transitions before describing the finished slice so interrupted runs
do not leave push-blocking ancestry behind.

## Agent Timeouts

The workflow configures agent timeouts to catch hung API calls:

| Timeout         | Default   | Purpose                                          |
| --------------- | --------- | ------------------------------------------------ |
| `timeoutMs`     | 4 hours   | Hard limit for long tasks                        |
| `idleTimeoutMs` | 5 minutes | Resets on stdout/stderr; catches stuck API calls |

The idle timeout is recommended for all agent configurations—it allows active work (compiling, testing) to run for the full hour, but kills the task if no output appears for 5 minutes (typical symptom of a hung API connection).

## Workflow Structure

Workflows must be **synchronous** at the top level. The `smithers()` wrapper expects a synchronous function that returns JSX immediately:

```typescript
// ✅ Correct: synchronous workflow function
export default smithers((ctx) => {
  return renderWorkflow(ctx, ...)
})

function renderWorkflow(ctx, ...) {
  // Synchronous logic only
  return (
    <Workflow>...</Workflow>
  )
}
```

**Do not make `renderWorkflow` async**—this causes the workflow to finish immediately without running tasks. Move async operations (shell commands, file checks) into Task functions, not the workflow render function.

## Debugging Stuck Tests

If workflow validation runs `bun run test:coverage` for more than roughly 5
minutes at high CPU with no output, check for recursive discovery inside nested
jj workspaces.

Useful checks:

```bash
ps -o pid,etime,time,pcpu,command -p <PID>
t1=$(ps -o time= -p <PID> | tr -d ' '); sleep 30; t2=$(ps -o time= -p <PID> | tr -d ' '); echo "$t1 -> $t2"
lsof -p <PID> | grep ".jj-workspaces"
```

This repository excludes both `.worktrees/**` and `.jj-workspaces/**` from
Vitest discovery in [vite.config.ts](/Users/samuel/git/effect-tanstack-baseline/vite.config.ts). If you see `.jj-workspaces/.jj-workspaces/...`
paths in `lsof`, that exclusion is the first thing to verify.
