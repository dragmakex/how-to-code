# Version Control, Collaboration, and Review

Version control is an engineering system, not a trash bin.

The goal is not merely to save changes.
The goal is to make work:

- understandable
- reviewable
- reproducible
- publishable with confidence
- safe to automate

## Core flow

A healthy flow has explicit stages:

1. start from a known repo state
2. isolate the work
3. make and verify the change
4. record the change with a coherent history entry
5. move the intended publication pointer deliberately
6. publish only when the reviewed state is actually ready

If those stages blur together, trust in history collapses.

## Isolation first

Before changing code, isolate the work.

That can be:

- a git branch
- a JJ bookmark
- a workspace/worktree
- another explicit unit of separation

Do not silently evolve multiple concerns in one mutable filesystem state when they should be reviewed independently.

## Local history should be intentional

Good local history is:

- easy to inspect
- easy to explain
- easy to reshape before publication
- scoped to coherent purposes

Do not wait until the end of the day and dump one giant “final changes” commit.

## Commit messages must explain intent

A strong default shape:

```text
type(scope): short specific summary
```

Then a body that answers:

1. why this change was needed
2. what goal it achieves
3. what behavior, invariant, or workflow it protects or improves

Good history reads like justified decisions, not archaeological debris.

## Publication should be explicit

Before publishing:

- the intended commit(s) should exist
- the correct branch/bookmark should point at them
- the right verification should have passed
- the published state should match the reviewed local state

Do not rely on fuzzy assumptions about HEAD.

## Reviewability is a design constraint

A change is too large when:

- a human cannot review it in one sitting
- its risk spans too many unrelated subsystems
- the intended behavior change is hard to isolate
- the verification story becomes vague

Split the work.

## Parallel work needs explicit structure

When several streams of work happen in parallel:

- create explicit workspaces or worktrees
- name them clearly
- keep validation tied to the right filesystem state
- avoid hidden branch drift
- publish one stream without dragging others along

This matters even more for automation and multi-agent workflows.

## Automation must be stricter than humans

Automated systems should not invent ad hoc VCS behavior.

They should:

- start from an explicit source revision
- create isolated work state explicitly
- record progress deliberately
- move publication pointers explicitly
- leave behind inspectable history and outputs

If an automated workflow cannot be explained to a human reviewer, it is too loose.

## Implementer responsibilities

Before implementation:

- read the relevant architecture and spec docs
- inspect recent related commits
- search the codebase before inventing abstractions
- establish a clean isolated work state
- run baseline validation if the change is substantial

After implementation:

- run the relevant verification chain
- document new learnings and mistakes if they matter
- commit in logical steps
- avoid bundling unrelated cleanup into the same slice unless clearly justified

## Reviewer responsibilities

Review against:

- the spec or requirement
- architectural boundaries
- invariants and guarantees
- verification quality
- security and operational consequences
- version-control hygiene

A reviewer should be able to answer:

- what changed?
- why was it necessary?
- what protects this from regression?
- what is still uncertain?

## Review handoff quality

A strong handoff includes:

- files changed
- work completed
- verification performed
- known limitations or follow-ups
- relevant decisions made
- blockers if any remain

This matters whether the producer is a human, agent, or pair.

## What to avoid

- working directly on `main` / `master`
- mixing unrelated work in one history entry
- publishing unverified changes
- hiding important reasoning outside the repo
- squashing away meaningful review history by default
- letting automation freestyle VCS operations
- using vague commit messages like `misc fixes`

## Final rule

Version control is working when:

- the purpose of each change is clear
- the ready-to-publish state is obvious
- concurrent work stays isolated
- automation is deterministic
- another engineer can understand the history without private context

That is the bar.