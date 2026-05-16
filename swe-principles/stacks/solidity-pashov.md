# Solidity with Pashov-Style Security Principles

This file is the Solidity-specific stack overlay.

Read this **after** the general field guides when your stack is:

- Solidity
- Foundry or Hardhat
- EVM protocols with real asset or authority risk
- systems where permissionless entry points and privileged operations matter

## Why this stack matters

Smart-contract systems fail differently from most application stacks.

The code is:

- adversarially exercised
- economically attackable
- constrained by irreversible state changes
- exposed through explicit public entry points
- dependent on trust boundaries that are often visible on-chain

The strongest generalized lessons from the Pashov skills are:

1. **map the protocol before hunting bugs**
2. **audit the hot contracts continuously, not just once at the end**
3. **reason from what the code allows, not what the deployer intended**
4. **inventory every state-changing entry point and privilege boundary**
5. **name invariants explicitly and verify them from code paths**
6. **use repeated, multi-lens review rather than one shallow pass**

## Primary source material to study

If you have the source material available, read these first:

- `solidity-auditor/SKILL.md`
- `solidity-auditor/README.md`
- `x-ray/SKILL.md`
- `x-ray/README.md`

## Solidity-specific rules worth carrying forward

## 1. Start with an x-ray of the system

Before deep review or major changes, produce a compact security map.

You should know:

- what the protocol is
- who the actors are
- what roles exist
- which entry points mutate state
- which assets or authorities matter
- which integrations and oracles are trusted
- which invariants appear to protect value
- where the test and documentation gaps are
- which files or recent changes are especially hot

Do not begin serious review by wandering file to file without a map.

## 2. Audit the hot contracts while developing

The Solidity auditor principle is not “scan everything once and feel safe”.

The high-signal workflow is:

- scope to the 2–5 contracts you are actively changing when possible
- run review more than once
- compare findings across passes
- use specialized lenses instead of one generic prompt

The useful lenses include:

- attack vectors
- math and precision
- access control
- economic abuse
- execution traces
- invariants
- periphery/integration misuse
- first-principles review

Smaller scoped review often beats shallow whole-repo review.

## 3. Enumerate every state-changing entry point

For each public or external state-changing function, classify:

- permissionless
- role-gated
- admin-only

Then record:

- caller type
- parameter trust assumptions
- downstream call chain
- state modified
- value flow direction
- reentrancy guard presence

This is not optional bookkeeping.
It is the attack surface map.

## 4. Reason from what the code allows

Do not grant safety credit based on likely operator behavior.

Ask:

- can the code path be called?
- by whom?
- under what preconditions?
- what state can it move to?
- what value can it redirect or lock?

If the code allows a bad transition, “the team would never do that” is not a defense.

## 5. Invariants are first-class engineering artifacts

Build and review around explicit invariant classes such as:

- conservation invariants
- authorization invariants
- bounded-value invariants
- one-shot or state-machine invariants
- temporal invariants
- cross-contract trust assumptions
- higher-order economic invariants

For each important invariant, know:

- where it is enforced
- where it is only assumed
- where a setter or side path could bypass it
- what test proves it

If the invariant is only implicit, it is easier to break.

## 6. Privileged roles must be analyzed operationally

For each privileged role, list:

- every action it can take
- whether the action is instant or delayed
- whether it can pause, redirect funds, change integrations, or alter limits
- what compromise of that role would mean

Important distinction:

- delay on role transfer is not the same as delay on operational actions

A role can be “safely administered” and still be operationally dangerous if its live powers are immediate.

## 7. Pause coverage is part of the threat model

Check which critical functions are actually pausable.

If an operation touches user funds or protocol-critical state, ask:

- should this stop during incident response?
- does the current pause model actually cover it?
- which bounded roles or entry points bypass the emergency brake?

Pause gaps should be attached to the relevant attack surface, not hidden as a footnote.

## 8. Test strategy must include adversarial behavior

A serious Solidity project should go beyond unit tests.

Use the right mix of:

- unit tests
- integration tests
- invariant tests
- stateless fuzzing
- stateful fuzzing
- fork tests where external integrations matter
- exploit regression tests for previously found issues

And remember:

- coverage-tool failure does not mean no tests exist
- test presence and coverage metrics are different signals
- missing invariant or fuzz tests is often a more meaningful gap than raw coverage percent

## 9. Fix verification matters as much as bug discovery

For any high-confidence issue and fix:

- replay the exploit path mentally or in tests with the fix applied
- check for introduced denial-of-service
- check for reentrancy fallout
- check for broken invariants elsewhere
- check all repeated instances of the same pattern

A patch that closes one hole while opening another is not done.

## 10. Threat models should match protocol type

The threat model for a vault is not the same as for:

- an AMM
- a lending market
- a bridge
- a staking system
- an auction mechanism
- governance infrastructure

Classify the protocol and then look for the abuse modes that follow from that class.

Also include:

- oracle dependence
- timing and ordering assumptions
- composability risks
- admin and keeper compromise scenarios
- economic extraction paths

## 11. Security review should use history and documentation too

Do not review source in a vacuum.

Also inspect:

- docs and whitepapers for claimed invariants
- test maturity and missing categories
- recent risky changes
- git hotspots
- late changes in dangerous files
- forked dependencies drifting from upstream

Security posture is shaped by evolution, not just current syntax.

## 12. Solidity done means audit-readiness, not just passing tests

Before a serious release or audit handoff, you should be able to produce:

- a protocol overview
- actor and privilege tables
- permissionless entry-point inventory
- invariant map
- integration and trust-boundary description
- test-gap summary
- concrete known risks and follow-ups

If auditors must build all of that from scratch, the project is not ready enough.

## If the stack only partially matches

Steal these ideas even outside Solidity:

- build an entry-point map before deep review
- classify privileges explicitly
- write down invariants as review objects
- use repeated specialized review passes
- reason from allowed behavior, not hoped-for behavior
- use test gaps and git history as security signals

Those are the durable lessons.