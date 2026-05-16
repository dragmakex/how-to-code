/**
 * Build the default workflow prompt for spec-driven implementation.
 * @param specsPath Spec entrypoint path for the current run.
 * @param todoPath Todo list path for the current run.
 * @returns Generic prompt instructions for the workflow.
 */
export function buildDefaultSpecPrompt(
  specsPath: string,
  todoPath: string,
): string {
  return `## Workflow inputs
Read ${specsPath}.
Read ${todoPath}.
Choose the next best vertical slice.
Implement slices end-to-end in this order: frontend/user flow -> contracts/API -> backend/domain -> integrated tests.
Do not close discovery early while any area is missing.
If you introduce or require new runtime configuration, update .env.example in the same slice.
Execute TDD end to end.
Commit on the workflow bookmark selected for the run.`
}
