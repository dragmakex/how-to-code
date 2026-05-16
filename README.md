# How To Code

A compact coding skill plus a deeper software-engineering handbook.

## What this repo is

This repo has two layers:

- `SKILL.md` — the small, agent-facing skill
- `swe-principles/` — the deeper handbook behind it

The idea is simple: keep the skill compact, and put the heavier material in markdown references.

## Repository structure

### `SKILL.md`
The main skill file. It holds the core taste, a little top-level guidance, and routing into the handbook. It should stay short.

### `swe-principles/README.md`
The handbook index. Start here if you want the map of the deeper material.

### `swe-principles/fields/`
General software-engineering guides. These are the default docs for architecture, guarantees, testing, version control, observability, security, docs, and agent workflow discipline.

### `swe-principles/checklists/`
Short handoff gates for implementation, review, and release readiness.

### `swe-principles/stacks/`
Stack-specific overlays. Use these only when the stack is a close match.

### `swe-principles/PROVENANCE.md`
Explains where the material came from and which parts are copied versus synthesized.

## How to use it

Start with `SKILL.md`.

Then:

- stay in the local repo’s code and docs for narrow tasks
- read `swe-principles/` only when you need deeper guidance
- use general `fields/` by default
- add `stacks/` overlays only for close stack matches
- use `checklists/` before handoff when the change is meaningful

## How to add on top of it

Keep the shape of the repo intact:

- add general ideas to `swe-principles/fields/`
- add handoff gates to `swe-principles/checklists/`
- add close-match stack overlays to `swe-principles/stacks/`
- update `SKILL.md` only with light routing, not big doctrine dumps
- update `PROVENANCE.md` when a new major source influences the repo

If you add an exact copied reference stack, keep it exact and separate from the synthesized handbook material.

## Install as a skill

Best approach: symlink this repo into a loaded skills directory, then reload the agent.

Example:

```bash
ln -s /Users/sticky/Documents/Projects/general_tools_strats/how-to-code ~/.claude/skills/how-to-code
```

Then run `/reload` or restart the agent.

## Maintainer rule

Keep `SKILL.md` compact, keep `swe-principles/` as the deep layer, and keep exact copied stacks exact.
