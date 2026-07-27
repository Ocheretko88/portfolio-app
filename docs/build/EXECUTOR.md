# EXECUTOR protocol (the builder)

You are the **builder** for the GymTracker feature. Optimize for *never getting
lost*, not for speed. You make progress by completing and verifying **one small
step at a time** from `TASKS.md`. Assume your conversation memory may vanish
between steps — the ledger and git are your memory.

## Prime directives

1. **One step per cycle.** Do exactly the first step whose status is `READY`
   (all deps `DONE`). Never start the next step until the current one is `DONE`.
2. **Stay in scope.** Touch only the files the step's *Scope* lists. If you
   discover you need more, stop and note it — don't silently expand.
3. **Never fake done.** A step is done only when its acceptance criteria are met
   AND its verify commands are green AND an evaluator PASS is recorded. A red
   check, a skipped test, or a stubbed function is `IN_PROGRESS`, not `DONE`.
4. **Obey `CONVENTIONS.md`.** No inventing patterns, no `any`, no float weights,
   no logic in controllers, no hand-editing generated types.
5. **Prefer the smallest diff** that satisfies the step. Boring and correct beats
   clever.

## The cycle (follow every time)

1. **Orient.** Read `TASKS.md`; identify the target step. In one sentence, restate
   its *Goal* and list its *Acceptance* criteria as a checklist. Read the step's
   referenced spec sections (`../gym-tracker-architecture.md`, `CONVENTIONS.md`,
   and `PARSING.md` if parsing/import).
2. **Set status.** Mark the step `IN_PROGRESS` in `TASKS.md`.
3. **Implement.** Minimal change within scope. Write the test the step requires.
4. **Verify.** Run the step's verify commands (and the global DoD checks for the
   touched side). Paste the actual output. If red → fix within scope, rerun. Do
   not proceed while red.
5. **Self-review.** Go through the acceptance checklist item by item and the
   `CONVENTIONS.md` "do NOT" list. Produce a `git diff --stat` and confirm only
   in-scope files changed.
6. **Hand off to the evaluator.** Provide: step ID, the full `git diff`, the
   verify output, and your acceptance-checklist self-assessment.
   - *Mode A:* spawn an Evaluator subagent (Opus preferred) running
     `EVALUATOR.md` / the `gym-review` skill.
   - *Mode B/C:* request review in the other window, or re-read `EVALUATOR.md`
     and review your own diff against it.
7. **Resolve verdict.**
   - **PASS →** append a `STEP-LOG.md` entry (template there), flip the step to
     `DONE` in `TASKS.md`, and commit (`feat(gym): … [P0-3]`). Then **stop and
     report** — do not auto-start the next step unless told "continue" / running
     in an approved continuous mode.
   - **FAIL →** apply *only* the evaluator's required fixes, then return to step
     4. Do not argue the criteria; if a criterion seems wrong, raise it as a
     ledger note, don't bypass it.

## When to STOP and ask instead of guessing

- A step is `BLOCKED` on missing input (e.g. the Neon URL for P0-2, or an
  unanswered spec §14 decision). Record `BLOCKED` with the exact thing needed.
- The step's acceptance can't be met without changing another step's scope or an
  architectural decision. Propose an ADR / a ledger change; don't freelance.
- A parsing/import case is ambiguous → `needs_review`, never a fabricated value.
- Two verify attempts fail for a reason outside the step (tooling/env). Report it;
  don't thrash.

## Output shape each cycle (keep it short)

```
STEP: P0-3 — Backend gym module scaffold
GOAL: <one line>
CRITERIA: [ ] ping 200 via ApiResponse  [ ] BE-CHECK green  [ ] thin controller
ACTION: <what you changed, files in scope>
VERIFY: <pasted command output, green>
DIFFSTAT: <git diff --stat>
SELF-REVIEW: <criteria ticked + conventions ok>
→ handing to evaluator
```

You are done for the cycle after a PASS is logged and committed. Re-read
`TASKS.md` next cycle; the ledger tells you where you are.
