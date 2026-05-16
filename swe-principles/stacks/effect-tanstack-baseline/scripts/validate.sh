#!/usr/bin/env bash
#
# Two-phase validation runner.
#
# Why two phases instead of running everything in parallel?
#
#   The heavy checks (test:coverage, test:component, perf:check) each consume
#   2–5 GB RSS. Running them concurrently pushes peak memory past 7 GB, which
#   causes swap-thrash or OOM on ≤4 GB machines and slows down larger machines
#   through memory pressure.
#
#   The light checks (typecheck, lint, format, docs) use <800 MB each and
#   finish in 1–4s, so parallelizing them is free in both CPU and memory.
#
# Phase 1 — light checks in parallel (~4s wall instead of ~8s sequential)
#   typecheck, lint, lint:design-system, format:check, docs:check
#
# Phase 2 — heavy checks sequential (~45s, peak RSS stays under ~5 GB)
#   test:coverage, test:component, perf:check
#
# Measured on the current codebase (2026-03):
#   Sequential:  ~52s wall, ~4.3 GB peak RSS
#   Phased:      ~48s wall, ~4.5 GB peak RSS
#   Full parallel: ~38s wall, ~7.0 GB peak RSS  ← unsafe on small machines
#
set -uo pipefail

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

fail=0

# --- Phase 1: light checks, parallel ----------------------------------------

bun run --silent typecheck          > "$tmp/typecheck.out"  2>&1 &
bun run --silent lint               > "$tmp/lint.out"       2>&1 &
bun run --silent lint:design-system > "$tmp/lint-ds.out"    2>&1 &
bun run --silent format:check       > "$tmp/format.out"     2>&1 &
bun run --silent docs:check         > "$tmp/docs.out"       2>&1 &

for pid in $(jobs -p); do
  wait "$pid" || fail=1
done

# --- Phase 2: heavy checks, sequential --------------------------------------

bun run --silent test:coverage  > "$tmp/test-cov.out"  2>&1 || fail=1
bun run --silent test:component > "$tmp/test-comp.out" 2>&1 || fail=1
bun run --silent perf:check     > "$tmp/perf.out"      2>&1 || fail=1

# --- Report ------------------------------------------------------------------

for f in "$tmp"/*.out; do
  name=$(basename "$f" .out)
  if [ -s "$f" ] && grep -qiE 'error|fail|not formatted' "$f"; then
    echo "  ❌ $name"
  else
    echo "  ✅ $name"
  fi
done

if [ "$fail" -ne 0 ]; then
  echo ""
  for f in "$tmp"/*.out; do
    name=$(basename "$f" .out)
    if grep -qiE 'error|fail|not formatted' "$f"; then
      echo "── $name ──"
      cat "$f"
      echo ""
    fi
  done
  echo "❌ Validation failed."
  exit 1
fi

echo ""
echo "✅ All checks passed."
