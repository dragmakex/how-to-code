# Documentation, Skills, and Knowledge Management

A codebase is also a knowledge system.

This field covers:

- documentation posture
- skill and handbook structure
- source-of-truth discipline
- progressive disclosure
- repo memory
- contribution guidance

## Documentation should teach operations

Good docs answer:

- what this system is for
- what the important boundaries are
- how it behaves under pressure
- where the common traps are
- how to verify or debug it

Bad docs are brochure copy and vague aspiration.

## Progressive disclosure is mandatory

Keep the top-level docs small and route readers to the next layer.

A useful ladder is:

1. index / routing doc
2. focused guide for the task at hand
3. deep reference material only when needed

This helps both humans and agents.

## Source of truth must be explicit

Every repo should make it clear which documents define:

- architecture rules
- contribution rules
- content schemas
- skill metadata conventions
- release/versioning behavior
- operational workflows

When everything is “kind of the source of truth”, nothing is.

## Validate docs when they encode contracts

If documentation carries structured meaning, validate it.

Examples:

- frontmatter schemas
- skill metadata
- registry shape
- directory placement rules
- generated docs checkers
- link integrity or format rules where appropriate

This is especially useful for:

- catalogs
- skills registries
- architecture indexes
- generated config docs

## Skill/package discipline

For reusable skill-like artifacts, a good structure is:

- compact metadata and activation description
- concise main instructions
- references for depth
- scripts/templates/assets when truly needed
- explicit security warnings in the main file when risk exists

Use clear rules such as:

- ALWAYS
- NEVER
- PREFER

They are easier to follow than soft prose when the behavior matters.

## Security guidance must be visible where the risk is created

If a doc or skill generates or configures:

- auth
- secrets
- data exposure
- caching scope
- network access
- permissions

then the security warning belongs in the main path, not buried in an optional appendix.

## Information architecture matters

Large knowledge repos need:

- canonical file placement
- stable slugs or IDs where useful
- backlinks or related-entry links where navigation matters
- category pages for discovery
- a shallow, inspectable top level

Do not let the repo become a swamp of one-off markdowns nobody can route through.

## Docs should match current reality

Do not write fantasy-roadmap documentation that describes systems which do not exist.

Document:

- what exists now
- what is intentionally missing
- what is experimental
- what is planned but not yet real

Reality-aligned docs are far more useful than visionary fiction.

## Keep memory files intentionally

For active engineering repos, keep a small set of explicit memory files when they pay for themselves.

Examples:

- `LEARNINGS.md` for environment and toolchain discoveries
- `MISTAKES.md` for repeated failure modes and how to avoid them
- `DESIRES.md` for tooling or context gaps worth solving later

These should be factual and low-drama.

## Contributing guides should be executable

A good `CONTRIBUTING.md` is:

- architecture-first
- decision-driven
- command-specific
- validation-oriented
- explicit about pitfalls

It should tell contributors:

- where to work based on what they are changing
- how to verify the change
- what quality gates exist
- what not to break

## Documentation quality checklist

A strong document:

- starts with purpose
- makes scope explicit
- points to the next relevant file
- uses headings readers can act on
- distinguishes policy from examples
- exposes traps and failure modes
- stays aligned with current reality

## Final rule

Treat documentation as part of the system design.

If maintainers cannot find the rule, understand the decision, or verify the behavior from the docs, the repo is carrying hidden knowledge.

Hidden knowledge becomes operational risk.