# Reviewer Checklist

Review against the requirement, the architecture, and the operating reality.

## Requirement fit

- [ ] The change matches the spec / PRD / acceptance criteria
- [ ] Scope creep is explicit, not accidental
- [ ] Non-goals were respected
- [ ] User-facing behavior is clear from the diff and tests

## Architecture fit

- [ ] Boundaries remain clean (route/application/projection/adapter or equivalent)
- [ ] New abstractions are justified by real invariants or reuse boundaries
- [ ] Canonical state ownership remains coherent
- [ ] Transport, persistence, and UI concerns are not complected
- [ ] Hidden time/randomness/global state did not sneak into pure modules

## Correctness and guarantees

- [ ] Important invariants are explicit
- [ ] Guarantees match the risk tier
- [ ] Runtime assertions or boundary validation exist where needed
- [ ] Persistence constraints exist where durable state requires them
- [ ] Failure paths were reviewed, not just success paths

## Tests and verification

- [ ] Tests protect behavior, not just the current implementation
- [ ] High-risk logic has stronger tests (property/invariant/integration where appropriate)
- [ ] Coverage claims are believable and support the real risk areas
- [ ] Build/lint/typecheck/test evidence is present
- [ ] UI work covers loading/empty/error/retry/accessibility states where relevant

## Observability and operations

- [ ] Production-significant changes preserve or improve observability
- [ ] Health/readiness implications are covered
- [ ] Error taxonomy / structured logging / spans remain coherent if touched
- [ ] Performance implications are acknowledged when relevant

## Security and audit readiness

- [ ] Trust boundaries are still clear
- [ ] Access-control changes are explicit and reviewed
- [ ] Entry-point changes were examined with their downstream effects
- [ ] Test gaps or unresolved risks are called out plainly

## Documentation and handoff

- [ ] Docs and operational notes were updated where needed
- [ ] The change is understandable without private context
- [ ] Remaining uncertainty or follow-up work is explicit

## Version control quality

- [ ] Work was isolated properly
- [ ] Commits are coherent and informative
- [ ] Publication state is clear
- [ ] Meaningful history was preserved

## Final question

- [ ] If this breaks in production, will the current diff, tests, docs, and telemetry make root-cause analysis faster instead of slower?