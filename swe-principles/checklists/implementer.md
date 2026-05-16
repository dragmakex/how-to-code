# Implementer Checklist

Use this before handing over a serious change.

## Before implementation

- [ ] Work is isolated in a branch, bookmark, worktree, or workspace
- [ ] Relevant spec / PRD / issue / acceptance criteria were read fully
- [ ] Existing architecture and local patterns were searched before inventing new ones
- [ ] Criticality tier is understood (T1/T2/T3/T4)
- [ ] Baseline verification was run if the change is broad or risky
- [ ] Scope, non-goals, and likely side effects are explicit

## During implementation

- [ ] Change stays within the architecture boundary model
- [ ] Core logic is not hidden in routes/controllers/adapters/UI
- [ ] Time, randomness, identity, and external quirks are explicit seams
- [ ] Canonical state ownership is preserved; derived views remain projections
- [ ] Unsafe escape hatches were avoided or explicitly justified
- [ ] Important invariants are named and protected at the right layers
- [ ] New abstractions were justified by a real boundary or invariant

## Verification

- [ ] Narrow lint/typecheck/test feedback was run during development
- [ ] Final changed-area tests pass
- [ ] Full required validation gates pass
- [ ] Build passes
- [ ] Important failure paths were verified, not just happy paths
- [ ] Persistence constraints were tested when they matter
- [ ] Observability / health / readiness checks were verified for production-significant work
- [ ] Performance budget check ran if the hot path or payload changed
- [ ] Security review happened if trust boundaries changed

## Documentation and repo memory

- [ ] Docs were updated where behavior or architecture changed
- [ ] Operational traps or decisions were documented, not buried in memory
- [ ] `LEARNINGS.md`, `MISTAKES.md`, or equivalent were updated if a repeated trap was discovered
- [ ] The change can be understood without the current session context

## Version control

- [ ] Commits are coherent and reviewable
- [ ] Commit messages explain why, goal, and protected behavior/invariant
- [ ] Unrelated cleanup was not bundled silently
- [ ] Ready-to-publish state is obvious

## Human reviewability

- [ ] A human can review this diff in one sitting
- [ ] Uncertainty is named explicitly
- [ ] Architecture-defining choices were not buried in a giant diff without discussion
- [ ] If the task structure would predictably produce slop, it was reframed or escalated

## Final question

- [ ] Could a maintainer who does not know today’s context still understand, verify, and operate this change a year from now?