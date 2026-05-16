# Release Readiness Checklist

Use this before shipping a meaningful change to users or operators.

## Scope and requirements

- [ ] Release scope is explicit
- [ ] Acceptance criteria are satisfied
- [ ] Open questions are either resolved or consciously deferred
- [ ] Non-goals remain intact

## Correctness

- [ ] Critical invariants are protected at the appropriate guarantee layers
- [ ] Boundary validation exists for dynamic inputs
- [ ] Persistence constraints are present for durable state that must not drift
- [ ] Known violation paths are tested

## Verification

- [ ] Required tests pass
- [ ] Required lint/typecheck/build gates pass
- [ ] Smoke tests pass
- [ ] Performance budgets pass where applicable
- [ ] High-risk modules received targeted review

## Observability and operations

- [ ] Health endpoint behavior is correct
- [ ] Readiness endpoint behavior is correct
- [ ] Logs, traces, and error reporting are wired and verified
- [ ] Correlation IDs or equivalent context are available
- [ ] Alerts or alert TODOs exist for critical failure modes
- [ ] Dashboards / queries / runbooks are available where needed

## Security

- [ ] Entry points and trust boundaries were reviewed
- [ ] Secrets handling is correct
- [ ] Access-control changes were verified
- [ ] Threat model changes are understood
- [ ] Audit-readiness gaps are documented if unresolved

## Documentation

- [ ] User-facing docs updated if behavior changed
- [ ] Operator-facing docs updated if operations changed
- [ ] Internal architecture or repo memory updated if design changed
- [ ] Release notes or change summary explain the real impact

## Version control and publication

- [ ] Published state matches reviewed state
- [ ] History is coherent and explainable
- [ ] Tag/branch/bookmark/release pointer is deliberate
- [ ] Rollback path is known

## Final question

- [ ] If this ships today, do we understand how it behaves, how to verify it, how to observe it, and how to recover if it fails?