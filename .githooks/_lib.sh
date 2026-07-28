#!/usr/bin/env sh
# Shared helpers for the repo's git hooks. Sourced, never executed directly.
#
# Kept POSIX-ish and dependency-free on purpose: these run on every commit, on
# whatever shell the contributor's git happens to use, and a hook that breaks
# is a hook that gets disabled.

# Colours only when stderr is a terminal, so CI/agent logs stay clean.
if [ -t 2 ]; then
  C_RED=$(printf '\033[31m'); C_YEL=$(printf '\033[33m')
  C_DIM=$(printf '\033[2m'); C_OFF=$(printf '\033[0m')
else
  C_RED=''; C_YEL=''; C_DIM=''; C_OFF=''
fi

FAILED=0

# Detail lines may themselves be multi-line (a list of offending files, say),
# so indent every physical line rather than every argument.
_detail() {
  for block in "$@"; do
    [ -n "$block" ] || continue
    # The trailing newline matters: without it `read` drops the final line.
    printf '%s\n' "$block" | sed 's/^/  /' | while IFS= read -r l; do
      printf '%s%s%s\n' "$C_DIM" "$l" "$C_OFF" >&2
    done
  done
}

# A blocking problem. Prints the rule, then why it matters.
fail() {
  printf '%s✖ %s%s\n' "$C_RED" "$1" "$C_OFF" >&2
  shift
  _detail "$@"
  FAILED=1
}

# Worth knowing, not worth blocking.
warn() {
  printf '%s▲ %s%s\n' "$C_YEL" "$1" "$C_OFF" >&2
  shift
  _detail "$@"
}

note() { printf '%s· %s%s\n' "$C_DIM" "$1" "$C_OFF" >&2; }

# Files staged for this commit (added/copied/modified/renamed — not deletions).
# Optional args are pathspecs.
staged_files() {
  git diff --cached --name-only --diff-filter=ACMR -- "$@"
}

# Files this commit DELETES.
deleted_files() {
  git diff --cached --name-only --diff-filter=D -- "$@"
}

# Content actually being committed (the index), not the working tree — the two
# can differ, and only the index is what lands in history.
staged_content() {
  git show ":$1" 2>/dev/null
}

# Search the staged content of every given file for a pattern.
# Usage: grep_staged '<extended regex>' file1 file2 ...
# Echoes "path:line:match" for each hit.
grep_staged() {
  pattern=$1
  shift
  for f in "$@"; do
    [ -n "$f" ] || continue
    staged_content "$f" | grep -nE "$pattern" 2>/dev/null | while IFS= read -r hit; do
      printf '%s:%s\n' "$f" "$hit"
    done
  done
}

# Exit with the right code and a uniform "how to get out of jail" message,
# worded for whichever hook is calling.
finish() {
  if [ "$FAILED" -ne 0 ]; then
    hook=$(basename "$0")
    case "$hook" in
      pre-push) verb='Push'; escape='SKIP_PREPUSH=1 git push   (or git push --no-verify)' ;;
      *)        verb='Commit'; escape='git commit --no-verify' ;;
    esac
    printf '\n%s%s blocked by .githooks/%s%s\n' "$C_RED" "$verb" "$hook" "$C_OFF" >&2
    printf '%sFix the above, or — only if you are certain the rule is wrong here —%s\n' "$C_DIM" "$C_OFF" >&2
    printf '%sre-run with: %s%s\n' "$C_DIM" "$escape" "$C_OFF" >&2
    printf '%sCI runs the same checks, so skipping only changes where you find out.%s\n' "$C_DIM" "$C_OFF" >&2
    exit 1
  fi
  exit 0
}
