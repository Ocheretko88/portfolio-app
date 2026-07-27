# Log notation grammar (derived from the real corpus)

The athlete records in Ukrainian free text. Both the **legacy importer** (P1) and
the **NL-logging agent** must map that text to `SET_ENTRY` rows. This is the spec
they implement and the evaluator checks against. Fixtures live in
`fixtures/training-log-corpus.md`.

## Session header

- `DD.MM.YYYY` → `performed_at` (dates are day-first; **not** US month-first).
- Optional trailing `(N дц)` → **cycle day** (день циклу). Store as
  `WORKOUT_SESSION.cycle_day` (nullable int). This is a real, meaningful training
  variable for the athlete — keep it.
- A title line may precede the date (`Тренування harder`) → `notes`/`title`.

## Item lines

`N. <exercise name>. <set spec>[. <free note>]`

- A blank numbered line (`1.`) = skipped/placeholder → ignore, do not create an item.
- `Заминка`, `Заcипка`, `Стретчинг`, `Активація` = cooldown/mobility with usually
  no load → create a `mobility` item with no sets, or skip per config.

## Set-spec tokens (all appear in the corpus)

| Token | Meaning | Example → parsed |
|---|---|---|
| `п` / `підхід` | set | `3 п` = 3 sets |
| `повторів` / `повтори` / `раз` | reps | `х 12 повторів` = 12 reps |
| `х` / `Х` | `×` separator | — |
| `1 п:` / `1-4п:` / `2-3 п:` | set index or **range** | `2-4 п: 30 кг Х 6` = sets 2,3,4 each 30 kg × 6 |
| `кг` | kilograms | `27.5кг` = 27500 g |
| `+N кг` | **added** weight (machine/body) | `+10 кг х 8 на сторону` |
| `на сторону` / `на кожну руку` / `окремо` | **unilateral** → `per_side=true` | reps are per side |
| `N млинець` / `2 млинці по 10 кг` | plates → **sum** | `2 млинці по 10 кг` = 20 kg |
| `по N кг` | N kg **each** (per hand/plate) | `по 15 кг` (two hands) = 30 kg total, `per_side=true` |
| `гриф` | empty barbell bar | ≈ 20 kg (configurable `BAR_WEIGHT_KG`) |
| `штанга` | loaded barbell | weight given elsewhere on the line |
| `без ваги` | bodyweight | `weight_grams=0`, `is_bodyweight=true` |
| `N lbs/M кг` | mixed units | prefer the kg value; keep raw in note |
| `секунд` | time-based hold | store in `duration`/note (planks) |

## Range expansion

`2-4 п: 30 кг Х 6` expands to **three** `SET_ENTRY` rows (set_number 2,3,4), each
30 kg × 6. `1 п: 27.5кг х 15, 2-3 п: 40 кг х 12` → set 1 @27.5×15, sets 2&3 @40×12.

## Free-note capture (never dropped)

Everything after the numbers — form cues, "ледве дотягнула", knee-pain notes,
"легко"/"важко" (perceived exertion), machine substitutions — goes verbatim into
`SET_ENTRY.notes` (or the item note). Perceived-exertion words MAY additionally
be mapped to a coarse `rpe` heuristic, but the raw text is always preserved.

## Ambiguity policy (importer + agent)

When a line can't be parsed with confidence: **do not guess silently.** The
importer writes the row to an `import_review` queue with the raw line; the agent
asks a one-line clarifying question or returns the row flagged `needs_review`.
Fabricating a weight/rep the athlete didn't write is a hard FAIL in evaluation.

## Eval expectation

`tests/.../ParsingTest` runs each corpus session through the parser and asserts
the exact `SET_ENTRY` set it should produce (golden files). The corpus is the
eval set; a parser change that regresses any golden case cannot be marked DONE.
