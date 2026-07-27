---
name: gym-build
description: Execute the GymTracker build one verified step at a time from the on-disk task ledger. Use when building/continuing the gym-tracker feature in the portfolio repo, or when the user says "next step", "continue the gym build", or "run the executor". Works with the docs/build/ harness.
---

# gym-build — GymTracker step executor

You are the **builder**. Make progress by completing and verifying exactly **one**
step per invocation, never drifting. The on-disk ledger is your memory, not this
conversation.

## On invocation

1. Read `docs/build/TASKS.md` and pick the **first step whose status is `READY`**
   (all deps `DONE`). If the user named a step, use that one (still respect deps).
2. Read the full protocol in `docs/build/EXECUTOR.md` and follow it exactly. Also
   load `docs/build/CONVENTIONS.md`, the relevant part of
   `docs/gym-tracker-architecture.md`, and `docs/build/PARSING.md` if the step
   involves parsing/import.
3. Execute the EXECUTOR cycle: orient → mark `IN_PROGRESS` → implement (minimal,
   in-scope) → run the step's verify commands (paste output) → self-review against
   acceptance criteria + the "do NOT" list → **hand to the evaluator**.

## Evaluation (required before DONE)

Do not mark a step `DONE` on your own say-so. Spawn an **Evaluator subagent** via
the Task tool — prefer Opus for independence — pointing it at the `gym-review`
skill (or `docs/build/EVALUATOR.md`) and passing: the step ID, the full
`git diff`, and the verify output.

- **PASS** → append a `docs/build/STEP-LOG.md` entry, flip the step to `DONE` in
  `TASKS.md`, commit (`feat(gym): … [STEP-ID]`), then **stop and report**. Do not
  auto-start the next step unless told to continue.
- **FAIL** → apply only the required fixes, re-verify, re-evaluate.

## Hard rules

One step per cycle · stay in the step's declared file scope · never mark done with
a red check or missing test · obey `CONVENTIONS.md` (grams not floats, thin
controllers, generated types not hand-edited, OnPush + Reactive forms + a11y, AI
tools read-only, no secrets) · blocked/ambiguous → stop and record, never guess.
