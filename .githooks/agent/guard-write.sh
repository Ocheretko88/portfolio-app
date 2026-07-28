#!/usr/bin/env bash
# PreToolUse guard for Edit / Write / NotebookEdit.
#
# Git hooks protect the *repository*; this protects the *working tree* from the
# agent, one tool call earlier and without needing a commit to notice. Exit 2
# blocks the call and hands the message back to the model, which then has to
# find another way — the point is not to punish, it is to make the wrong path
# unavailable so the right one gets taken.
#
# Fail-open by design: if jq is missing or the payload is unexpected, allow.
# A guard that breaks the agent on malformed input is worse than no guard.

set -uo pipefail

INPUT=$(cat)
command -v jq >/dev/null 2>&1 || exit 0

FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -n "$FILE" ] || exit 0

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
REL="${FILE#"$ROOT"/}"

deny() {
  printf 'Blocked by .claude/hooks/guard-write.sh — %s\n\n%s\n' "$1" "$2" >&2
  exit 2
}

case "$REL" in
  src/app/core/api/generated/*)
    deny "$REL is generated code." \
"This file is produced by 'npm run api:types' from src/app/core/api/openapi.yaml.
Hand-edits are overwritten on the next generate and are an instant evaluator
FAIL (CONVENTIONS.md). Change the OpenAPI spec instead, then regenerate." ;;

  .env|.env.local|.env.*.local)
    deny "$REL holds secrets." \
"Never write real credentials into a tracked file. Document the variable in
.env.example instead, and set the value in the local .env by hand." ;;

  node_modules/*|dist/*|.angular/*|coverage/*)
    deny "$REL is build output or a dependency." \
"Editing it has no lasting effect — the next install or build discards it.
Change the source that produces it." ;;

  package-lock.json)
    deny "package-lock.json is a lockfile." \
"Hand-editing a lockfile produces an install nobody else can reproduce.
Run the npm command that makes the change instead." ;;

  public/fonts/*)
    deny "public/fonts holds vendored upstream font binaries (H-2)." \
"These are byte-identical copies of the published @fontsource-variable packages
and are verified as such. Replace them by re-vendoring from upstream, never by
editing in place." ;;
esac

# ── Tests may not be gutted to make a check pass ─────────────────────────────
# Only meaningful for Write (whole-file replacement) where we can see the new
# content and compare it against what is on disk.
case "$REL" in
  *.spec.ts)
    NEW=$(printf '%s' "$INPUT" | jq -r '.tool_input.content // empty')
    [ -n "$NEW" ] || exit 0
    [ -f "$FILE" ] || exit 0
    count() { grep -cE '(^|[^a-zA-Z.])(it|test)\(' "$1" 2>/dev/null || echo 0; }
    OLD_N=$(count "$FILE")
    NEW_N=$(printf '%s' "$NEW" | grep -cE '(^|[^a-zA-Z.])(it|test)\(' || echo 0)
    if [ "$NEW_N" -lt "$OLD_N" ]; then
      deny "this rewrite drops $((OLD_N - NEW_N)) of $OLD_N test case(s) from $REL." \
"Removing coverage to get a green check is the failure mode this repo's build
harness exists to prevent. If a test is genuinely obsolete, delete it in its own
commit with the reason stated, rather than folding it into an unrelated edit."
    fi ;;
esac

exit 0
