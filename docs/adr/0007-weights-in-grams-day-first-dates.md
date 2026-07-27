# 7. Store weights as integer grams; parse dates day-first

Date: 2026-07-24

## Status

Accepted

## Context

The athlete records weights in kilograms with fractional plates (27.5, 12.5,
1.25 kg) and occasionally in pounds (`30 lbs/13.5 кг`). Floating-point storage of
weight drifts and complicates the exact arithmetic behind training volume
(Σ reps × weight) and personal-record detection. Dates in the log are written
**day-first** (`DD.MM.YYYY`), never US month-first, and sessions sometimes carry a
cycle-day tag `(N дц)`. See `docs/build/PARSING.md`.

## Decision

- Store weight canonically as an **integer number of grams**. Display converts to
  kg or lb per user preference; never store a float for weight.
- Parse and emit dates **day-first**; store as native date/datetime. Keep the
  optional cycle day as a nullable integer on the session.
- Preserve the athlete's free-text notes verbatim; perceived-exertion words
  ("легко"/"важко") may additionally map to a coarse RPE, but the raw text is
  never discarded.

## Consequences

- Volume and PR math is exact — no rounding error accumulates across sets.
- A small unit-conversion layer is required at the UI boundary (kg/lb toggle) and
  in the importer for mixed-unit lines.
- The importer and the NL-logging agent must follow the grammar in
  `PARSING.md`; ambiguous lines are flagged `needs_review`, never guessed.
- Cycle day is retained as a first-class, analysable training variable.
