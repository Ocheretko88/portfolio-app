#!/usr/bin/env bash
# PreToolUse guard for Bash.
#
# Two jobs:
#   1. Stop the agent from *disarming* the other guards (--no-verify, editing
#      core.hooksPath). A safety rail that the thing it restrains can remove is
#      decoration.
#   2. Stop commands that destroy work which is not yet in git — the one class
#      of mistake this repo cannot recover from.
#
# Fail-open on unexpected input, same reasoning as guard-write.sh.

set -uo pipefail

INPUT=$(cat)
command -v jq >/dev/null 2>&1 || exit 0

CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
[ -n "$CMD" ] || exit 0

deny() {
  printf 'Blocked by .claude/hooks/guard-bash.sh — %s\n\n%s\n' "$1" "$2" >&2
  exit 2
}

# ── Disarming the hooks ──────────────────────────────────────────────────────
if printf '%s' "$CMD" | grep -qE 'git +(commit|push)([^|;&]*)(--no-verify|[[:space:]]-[a-zA-Z]*n[a-zA-Z]*([[:space:]]|$))'; then
  deny "this bypasses the git hooks (--no-verify)." \
"The hooks encode this project's Definition of Done. If a hook is wrong, fix the
hook in .githooks/ and say so — do not route around it. If a check is failing,
the check is the message.
(The human can still bypass it themselves; you should not.)"
fi

if printf '%s' "$CMD" | grep -qE 'git +config[^|;&]*core\.hooksPath'; then
  deny "this repoints or disables the repo's git hooks." \
"core.hooksPath is set to .githooks by design, and the hooks are versioned so
every clone gets them. Changing it silently disables every gate."
fi

# ── Destroying uncommitted work ──────────────────────────────────────────────
if printf '%s' "$CMD" | grep -qE 'git +reset +(--hard|--merge)|git +checkout +(--?[a-z]+ +)*(\.|--[[:space:]]+\.)|git +restore +[^|;&]*(\.|--staged +\.)|git +clean +-[a-zA-Z]*[fdx]'; then
  deny "this discards uncommitted changes irreversibly." \
"Nothing in the working tree is recoverable after this — including work the
human did outside your session. If you need a clean tree, stash it
('git stash push -u -m \"<why>\"') so it can be recovered."
fi

if printf '%s' "$CMD" | grep -qE 'git +push[^|;&]*(--force([^-]|$)|-f([[:space:]]|$))' && \
   ! printf '%s' "$CMD" | grep -q -- '--force-with-lease'; then
  deny "this force-pushes." \
"A plain --force overwrites whatever is on the remote, including commits you
never fetched. Use --force-with-lease if a rewrite is genuinely needed."
fi

if printf '%s' "$CMD" | grep -qE '(^|[|;&[:space:]])rm +(-[a-zA-Z]*[rR][a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*[rR]) +(/|~|\$HOME|\.\.?/?[[:space:]]*$)'; then
  deny "this recursively deletes a root, home or parent path." \
"Delete the specific directory you mean, by full path."
fi

exit 0
