# Agent Skills Registry

This directory contains specialized agent skills integrated from external repositories. Each skill provides domain-specific guidance for AI-assisted development.

## Skills Overview

| Skill                    | Source                                                                                                          | Version | Last Updated | Description                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- | ------- | ------------ | ---------------------------------------------------- |
| `react-best-practices`   | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)   | 1.0.0   | 2026-04-16   | React & Next.js performance optimization (70+ rules) |
| `composition-patterns`   | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns)   | 1.0.0   | 2026-04-16   | React composition patterns for scalable components   |
| `react-view-transitions` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-view-transitions) | 1.0.0   | 2026-04-16   | React View Transition API implementation guide       |
| `versioncontrol`         | local                                                                                                           | -       | -            | Git/jj version control workflow enforcement          |

## Source Repository

**Primary external source:**

- **URL:** https://github.com/vercel-labs/agent-skills
- **Branch:** `main`
- **License:** MIT

## Checking for Updates

To check for skill updates from upstream:

```bash
# Check the latest commit dates on the source repo
curl -s https://api.github.com/repos/vercel-labs/agent-skills/commits?path=skills/react-best-practices/SKILL.md | head -20
curl -s https://api.github.com/repos/vercel-labs/agent-skills/commits?path=skills/composition-patterns/SKILL.md | head -20
curl -s https://api.github.com/repos/vercel-labs/agent-skills/commits?path=skills/react-view-transitions/SKILL.md | head -20

# Compare with local files (check git history for .agents/skills/)
git log --oneline --all -- .agents/skills/react-best-practices/SKILL.md
```

## Updating Skills

To update a skill from upstream:

1. Check the source repository for changes
2. Download updated files (preserve local modifications like `tanstack-start.md`)
3. Update the version and date in this README
4. Update the frontmatter in the skill's `SKILL.md`
5. Document any local modifications in the skill's notes below

## Local Modifications

### react-view-transitions

- **Modified:** `references/nextjs.md` → `references/tanstack-start.md`
- **Reason:** Project uses TanStack Start + Vite instead of Next.js
- **Date:** 2026-04-16
- **Upstream check:** If Next.js guide changes, adapt patterns to TanStack Start

## Skill File Structure

Each skill follows this structure:

```
skills/<skill-name>/
├── SKILL.md          # Skill metadata, triggers, quick reference
├── AGENTS.md         # Full compiled documentation
└── [references/]     # Optional additional guides
    └── *.md
```

The `SKILL.md` frontmatter includes:

- `name`: Unique skill identifier
- `description`: When to use this skill
- `license`: Source license
- `metadata.source`: Git repository URL
- `metadata.version`: Skill version (track upstream)
- `metadata.imported`: Date of last import
- `metadata.commit`: Source commit hash (for precise tracking)

## Adding New Skills

When integrating a new skill from vercel-labs/agent-skills:

1. Create directory: `mkdir -p skills/<skill-name>`
2. Download `SKILL.md` and `AGENTS.md` from source
3. Download any `references/*.md` files
4. Update frontmatter with source tracking metadata
5. Add entry to this README
6. Document any local modifications
7. Commit with message: `feat(agents): add <skill-name> skill`
