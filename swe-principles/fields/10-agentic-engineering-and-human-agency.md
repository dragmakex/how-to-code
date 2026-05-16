# Agentic Engineering and Human Agency

This field is about how humans and agents should behave while changing software.

The biggest risk is not that the agent cannot type code.
The biggest risk is that it can type too much code too quickly with too little review, too much mimicry, and too little explicit design judgment.

## Reviewability is a hard constraint

Do not optimize for code-per-hour.

Optimize for:

- what a human can review
- what can be verified in context
- what can be explained after the fact

A clean small diff beats a sprawling “complete solution” nobody can safely audit.

## Search before inventing

Before adding code, search aggressively for:

- the existing noun
- the existing verb
- the existing helper
- the adjacent subsystem
- the local pattern header or reference implementation

The bigger the repo, the more likely the idea already exists under another name.

## Do not extend a weak pattern blindly

Agents are especially vulnerable to local mimicry.

If the repo already contains a weak pattern, the agent will happily continue it forever unless someone stops it.

Before extending a recurring pattern, ask:

- is this pattern justified?
- what invariant does it protect?
- should we continue it, fix it, replace it, or stop using it?

## Architecture-defining work needs the human in the loop

If the change defines the gestalt of the system, slow down.

Examples:

- core data model
- naming conventions
- public API shape
- persistence model
- event model
- design-system contract
- auth model

Preferred cadence:

1. propose the shape
2. explain the tradeoff
3. get confirmation
4. implement in small steps

Do not silently bury architectural decisions in a giant diff.

## Be explicit about uncertainty

Useful sentences:

- I could not verify this assumption.
- I found a likely duplicate but could not prove it is the same concept.
- This test covers the happy path but not the suspected failure mode.
- This change alters behavior outside the requested scope.
- I am not confident this pattern matches the repository’s style.

Uncertainty named is manageable.
Uncertainty hidden becomes somebody else’s incident.

## File edits must stand alone

When editing persistent files, remember:

- the next reader may not have the previous context
- the old text may be gone forever
- the new text must make sense on its own

Never rely on the pre-edit version living in the next reader’s head.

## Do not accept every task as posed

Push back when the request would predictably produce slop.

Escalate or reframe when asked to:

- define architecture without discussion
- produce more code than can be reviewed
- auto-fix a whole repo without inspection
- run unattended on mission-critical code
- optimize a narrow metric as if it were total quality

A good agent can say no.

## Use structured delegation if multiple agents are involved

When delegating or parallelizing:

- scope each task tightly
- define success and verification explicitly
- require a structured handoff
- keep one owner responsible for synthesis and final judgment

Parallelism without synthesis just creates faster confusion.

## Keep a visible mistake log

Agents repeat mistakes across sessions unless the repo teaches them not to.

Maintain small factual files like:

- `MISTAKES.md`
- `LEARNINGS.md`
- `DESIRES.md`

This is not bureaucracy. It is anti-amnesia.

## Final rule

The agent should increase human agency, not erase it.

If the workflow makes the human less able to:

- understand the system
- review the change
- learn the pattern
- contest the architecture
- maintain the code later

then the workflow is wrong, even if the code compiles.