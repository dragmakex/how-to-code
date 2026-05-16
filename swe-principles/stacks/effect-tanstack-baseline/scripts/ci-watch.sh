#!/usr/bin/env bash
# CI Watch Helper - Poll GitHub Actions and report status
# Usage: ./scripts/ci-watch.sh
#
# Polls CI status silently until completion.
# Shows spinner progress, then final status.
# On failure, fetches and displays failed job logs.

set -e

MAX_POLLS=120  # 10 minutes max (120 * 5s)
POLL_INTERVAL=5
SPINNER=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")

# Clear line and print status
print_status() {
  printf "\r\033[K%s" "$1"
}

echo "🔍 Watching CI status..."

for i in $(seq 1 $MAX_POLLS); do
  spin_idx=$((i % ${#SPINNER[@]}))

  # Get current status
  ci_result=$(gh pr view --json statusCheckRollup --jq '.statusCheckRollup[] | "\(.name)|\(.status)|\(.conclusion)"' 2>/dev/null || echo "ERROR")

  if [ "$ci_result" = "ERROR" ]; then
    print_status "${SPINNER[$spin_idx]} Waiting for CI to start..."
    sleep $POLL_INTERVAL
    continue
  fi

  # Parse results
  all_completed=true
  any_failed=false
  completed_count=0
  total_count=0
  in_progress=""

  while IFS='|' read -r name status conclusion; do
    ((total_count++)) || true
    if [ "$status" != "COMPLETED" ]; then
      all_completed=false
      in_progress="$name"
    else
      ((completed_count++)) || true
      if [ "$conclusion" = "FAILURE" ]; then
        any_failed=true
      fi
    fi
  done <<< "$ci_result"

  # Show progress
  if [ "$all_completed" = false ]; then
    print_status "${SPINNER[$spin_idx]} CI running: $completed_count/$total_count complete | $in_progress..."
    sleep $POLL_INTERVAL
    continue
  fi

  # All completed - show final status
  echo ""
  echo ""

  if [ "$any_failed" = true ]; then
    echo "❌ CI FAILED"
    echo ""

    # Show final job statuses
    while IFS='|' read -r name status conclusion; do
      if [ "$conclusion" = "SUCCESS" ]; then
        echo "  ✅ $name"
      elif [ "$conclusion" = "FAILURE" ]; then
        echo "  ❌ $name"
      else
        echo "  ⚪ $name: $conclusion"
      fi
    done <<< "$ci_result"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Failed Job Logs"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Get the latest run ID and failed job logs
    run_id=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')
    failed_jobs=$(gh run view "$run_id" --json jobs --jq '.jobs[] | select(.conclusion == "failure") | "\(.name)|\(.databaseId)"')

    while IFS='|' read -r job_name job_id; do
      if [ -n "$job_id" ]; then
        echo "── $job_name ──"
        gh run view "$run_id" --job "$job_id" --log-failed 2>/dev/null | tail -60
        echo ""
      fi
    done <<< "$failed_jobs"

    exit 1
  else
    echo "✅ CI PASSED"
    echo ""

    # Show all job statuses
    while IFS='|' read -r name status conclusion; do
      echo "  ✅ $name"
    done <<< "$ci_result"

    echo ""
    exit 0
  fi
done

echo ""
echo "⏱️  Timeout: CI did not complete within $(($MAX_POLLS * $POLL_INTERVAL / 60)) minutes"
exit 1
