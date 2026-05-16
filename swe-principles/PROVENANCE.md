# Provenance

This folder is built from a mix of:

1. **imported reference material**
2. **generalized engineering principles**
3. **stack-specific adaptations**

## Imported reference stack

The directory `stacks/effect-tanstack-baseline/` is a direct working-tree copy derived from:

- `@effect-tanstack-baseline/`

The copy is intended to preserve the source stack content unchanged.
To avoid embedding repository metadata inside this repository, nested `.git/` contents are not carried over.

The imported stack includes the full working tree shape, including:

- root docs like `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`
- operational docs like `TESTING_AND_TELEMETRY.md` and `SENTRY_EFFECT_PROOF.md`
- repo memory like `LEARNINGS.md` and `MISTAKES.md`
- `docs/**`
- `specs/**`
- `workflows/**`
- `.agents/**`
- config, scripts, tests, public assets, and source files

The content was copied because it contains a strong, concrete expression of:

- explicit architecture boundaries
- guarantee layering
- code-quality enforcement
- testing discipline
- observability workflows
- version-control rigor

## Copy policy vs synthesis policy

The repository uses two different approaches intentionally:

- `stacks/effect-tanstack-baseline/` is preserved as a direct source-stack copy
- the general `fields/`, `checklists/`, and overlay stack docs are synthesized and adapted for this handbook

Local handbook wording may differ from any imported source, but the baseline stack snapshot itself is kept unchanged.

## Synthesized sources

The general field guides and stack overlays synthesize ideas from:

- `@allium/`
  - specification-first engineering
  - elicitation vs distillation
  - scope / includes / excludes
  - what-vs-how separation
  - terminology discipline
  - test propagation from behavioral specs
- `@apollographql_skills/`
  - skill packaging discipline
  - progressive disclosure
  - metadata and validation shape
  - Rust best-practice ideas where language-specific discipline matters
- `@awesome-gina/`
  - information architecture
  - schema-backed content organization
  - source-of-truth discipline
  - validation-oriented documentation structure
- `@effect-tanstack-baseline/`
  - primary structural influence for this folder
  - architecture, guarantees, testing, code quality, version control
- `@effect-tanstack-solid/`
  - stronger state-model guidance
  - design-system enforcement
  - observability integration patterns
  - performance budget discipline
  - Solid-specific reactive state lessons
- `@great-repo-files/`
  - anti-slop workflow enforcement
  - immediate validation discipline
  - testing framework selection
  - documentation style and contributing-guide rigor
- `@local-isolated-ralph/`
  - PRD verification
  - criticality tiers
  - definition-of-done structure
  - todo decomposition
  - implementer/reviewer workflow expectations
- `@laos/`
  - local-first observability stack
  - traces / logs / profiles / errors / analytics correlation
  - app wiring and verification workflows
- `@pashov_skills/`
  - x-ray style audit-readiness workflows
  - entry-point and invariant review
  - repeated, scoped, multi-lens security review

## Interpretation rule

The goal of this repository is twofold:

- preserve exact reference stacks where a concrete source stack is worth keeping intact
- preserve the **highest-signal engineering ideas** as generalized rules and overlays

Those ideas appear in two forms:

- **general rules** that apply across stacks
- **stack references** that apply when the concrete stack matches

## How to extend this repository

When importing future material:

1. Preserve provenance explicitly
2. Keep general principles separate from stack-specific prescriptions
3. Prefer small, composable field guides over one giant doctrine file
4. Note when imported content is copied directly vs generalized
5. If a stack snapshot is meant to be verbatim, keep it verbatim; if a handbook doc is synthesized, adapt it consistently
