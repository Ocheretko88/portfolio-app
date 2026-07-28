# Hooks — what stops broken code, and where

Three layers, deliberately overlapping. Each one catches what the layer before
it can miss, and the last one cannot be bypassed by anybody.

| Layer | Lives in | Runs when | Bypassable? |
|---|---|---|---|
| **Agent guards** | `.claude/settings.json` + `.claude/hooks/` | an AI agent calls Edit/Write/Bash | not by the agent — that's the point |
| **Git hooks** | `.githooks/` | commit / push | `--no-verify` (by a human, deliberately) |
| **CI** | `.github/workflows/ci.yml` | push / PR | no |

## Install

Nothing to install — `npm install` points git at this directory:

```json
"prepare": "git config core.hooksPath .githooks"
```

Verify with `git config core.hooksPath` (expect `.githooks`). To wire it up by
hand: `npm run hooks:install`.

Hooks are versioned, so every clone gets the same ones — unlike `.git/hooks`,
which is local-only and silently absent for everyone who did not set it up.

## What each hook does

**`pre-commit`** — fast (~1-2s), looks only at what is staged:

- blocks `.env`, keys, `dist/`, `node_modules/`, the generated version stamp
- regenerates `contract.ts` and blocks the commit if the staged copy differs —
  catches both a hand-edited generated file and a spec change committed without
  regenerating
- blocks deleting a `*.spec.ts` (override: `ALLOW_TEST_DELETE=1`)
- blocks `.only` / `.skip` / `fdescribe` / `fit` / `xit`
- blocks `debugger`; warns on `console.log`
- blocks the idioms this codebase has already ruled out: `*ngIf`/`*ngFor`,
  `[ngClass]`/`[ngStyle]`, `@HostBinding`/`@HostListener`, `standalone: true`
- blocks unformatted files

**`commit-msg`** — Conventional Commits, subject ≤ 72 chars, and a warning when
code changes carry no build-ledger step ID (`[P1-7]`, `[H-2]`).

**`pre-push`** — the full Definition of Done (~30-60s): `format:check`,
`typecheck`, `test`, `build`, plus a contract-drift check that CI does not
currently run. Skip with `SKIP_PREPUSH=1 git push` — CI still runs it, so this
only changes where you find out.

## What the agent guards do

`PreToolUse` hooks return exit code 2, which blocks the tool call and returns
the message to the model, so it has to take a different route.

- **`guard-write.sh`** refuses writes to generated code, `.env`, lockfiles,
  build output and the vendored fonts — and refuses a `Write` to a `*.spec.ts`
  that contains *fewer* test cases than the file already on disk. Deleting
  coverage to turn a check green is the exact failure this repo's build harness
  exists to prevent.
- **`guard-bash.sh`** refuses `--no-verify`, edits to `core.hooksPath`,
  `git reset --hard` / `checkout -- .` / `clean -fd`, plain `--force` pushes,
  and `rm -rf` aimed at a root, home or parent path.

Both fail open: if `jq` is missing or the payload is unexpected, the call is
allowed. A guard that jams on malformed input is worse than no guard.

## Installing the agent guards

`.claude/` cannot be written by a remote agent — a platform rule, and the right
one: a guard an agent can install is a guard it can uninstall. So the reviewed
copies live in `.githooks/agent/` and you install them yourself, once:

```sh
npm run hooks:agent          # app        (composer run-script hooks-agent  in the api)
```

That copies `settings.json` and the two guard scripts into `.claude/`. Re-run it
after changing anything in `.githooks/agent/`.

## CI additions (apply by hand)

Workflow files are likewise not remote-writable. These steps belong at the end
of the `verify` job in `.github/workflows/ci.yml` — they re-assert what a
`--no-verify` commit could otherwise skip:

```yaml
      - name: API types match the contract
        run: |
          npm run api:types
          git diff --exit-code -- src/app/core/api/generated/contract.ts \
            || { echo "::error::contract.ts is out of date — run 'npm run api:types' and commit the result"; exit 1; }

      - name: No focused, skipped or debug-only code
        run: |
          set -o pipefail
          fail=0
          check() {
            if hits=$(grep -rnE "$2" src --include='*.ts' --include='*.html' | grep -v '/generated/'); then
              echo "::error::$1"; printf '%s\n' "$hits"; fail=1
            fi
          }
          check "focused or skipped tests" '(^|[^a-zA-Z.])(fdescribe|fit|xit|xdescribe)\(|\b(describe|it|test)\.(only|skip)\('
          check "debugger statement" '^\s*debugger;?\s*$'
          check "legacy Angular idioms (use @if/@for and class/style bindings)" '\*ngIf|\*ngFor|\*ngSwitch|\[ngClass\]|\[ngStyle\]'
          check "forbidden decorators / standalone flag" '@HostBinding|@HostListener|standalone:\s*true'
          exit $fail
```

## The layer that is still missing

Branch protection on `main` (require a PR and a green CI run) is a GitHub
settings change nobody but the repo owner can make. Until it is on, every gate
here is advisory: a direct push to `main` skips all of them.

## Changing a rule

Edit the hook, commit it like any other code, say why in the message. A rule
nobody can explain is a rule that gets bypassed — and every rule here traces
back to `docs/build/CONVENTIONS.md` or the Definition of Done in
`docs/build/README.md`.
