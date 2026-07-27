# TASKS — the build ledger

Single source of truth for progress. The executor works the **first step whose
status is `READY`** (all deps `DONE`). Statuses: `READY` · `IN_PROGRESS` ·
`BLOCKED` · `DONE`. Only an EVALUATOR **PASS** flips a step to `DONE`.

Each step is deliberately small enough to implement and verify in one cycle.
Phases P0–P1 are fully decomposed (build these next). P2–P4 are step *groups* —
decompose the group into atomic steps (same template) when you reach it; do not
pre-expand far-future work.

**Verify command legend**
`FE-CHECK` = `npm run typecheck && npm test && npm run format:check && npm run build`
`BE-CHECK` = `composer test && ./vendor/bin/pint --test`
`TYPES` = `npm run api:types` (clean, no diff beyond intended)

---

## Phase 0 — Foundations  *(outcome: empty but wired end-to-end)*

### P0-1 · Record decisions as ADRs — `DONE`
- **Deps:** none · **Scope:** `portfolio-app/docs/adr/000X-*.md`
- **Goal:** ADRs for (a) adding the Gym bounded context, (b) Neon Postgres for gym data, (c) units-in-grams + day-first dates, resolving spec §14.
- **Acceptance:** one ADR per decision, existing numbered format, status Accepted; no code changes.
- **Verify:** n/a (docs) · **Evaluator focus:** decisions match spec + user's §14 answers; nothing implemented yet.

### P0-2 · Neon connection — `DONE`
- **Deps:** P0-1 · **Scope:** `portfolio-api/config/database.php`, `.env.example`, `render.yaml`
- **Goal:** add `pgsql` connection via `DB_URL`; document env vars (`sync:false` in render.yaml). No secret committed.
- **Acceptance:** `php artisan migrate` runs clean against an empty Neon DB; SQLite path still works for existing CV data if kept; `.env.example` updated.
- **Verify:** `php artisan migrate:fresh` on a scratch DB · **Evaluator focus:** no secrets in git; connection switch is config-only.

### P0-3 · Backend gym module scaffold — `DONE`
- **Deps:** P0-1 · **Scope:** `portfolio-api/app/Domain/Gym/**` (empty dirs + placeholders), `routes/api.php` (`/api/v1/gym` group), `app/Providers`
- **Goal:** create the layer folders (Controllers, Services, Repositories, Contracts, Resources, Requests) and an empty route group returning 200 on a `/gym/ping`.
- **Acceptance:** `GET /api/v1/gym/ping` → `ApiResponse::ok`; BE-CHECK green; no business logic.
- **Verify:** `BE-CHECK` + curl ping test · **Evaluator focus:** layering present, controller is thin, envelope used.

### P0-4 · Migrations — `DONE`
- **Deps:** P0-2, P0-3 · **Scope:** `portfolio-api/database/migrations/*`
- **Goal:** tables per spec §3 — exercises, workout_sessions (**incl. `cycle_day` nullable**), set_entries (grams, per_side, is_warmup, is_pr, notes), programs, program_blocks, program_items, program_resources, share_links, personal_records; plus an `import_reviews` table (see PARSING.md).
- **Acceptance:** `migrate:fresh` clean; FKs + indexes (share token indexed) present; grams are integers.
- **Verify:** `php artisan migrate:fresh` · **Evaluator focus:** schema matches ERD; units/day-first honored; nothing missing from §3.

### P0-5 · Models + factories — `DONE`
- **Deps:** P0-4 · **Scope:** `app/Models/Gym/*`, `database/factories/Gym/*`
- **Goal:** Eloquent models + relationships + factories.
- **Acceptance:** factory `create()` works for every model; relationships covered by a smoke test; BE-CHECK green.
- **Verify:** `BE-CHECK` · **Evaluator focus:** relationships match ERD; no fat models.

### P0-6 · Exercise catalog seeder — `DONE`
- **Deps:** P0-5 · **Scope:** `database/seeders/ExerciseCatalogSeeder.php`
- **Goal:** seed the athlete's **actual** exercises from `fixtures/training-log-corpus.md` (Ukrainian name + English slug + muscle + equipment + is_bodyweight), ~60–80 total incl. all corpus movements.
- **Acceptance:** every exercise named in the corpus resolves to a seeded row; seeder idempotent; muscle/equipment tagged.
- **Verify:** `php artisan db:seed --class=ExerciseCatalogSeeder` twice (idempotent) · **Evaluator focus:** corpus coverage is complete (cross-check the list in the fixture).
- **Pending on your machine:** run the seeder once against your real Neon DB (`php artisan db:seed --class=ExerciseCatalogSeeder`) to populate the 72 exercises — the migrations are run, but seeding is a separate step.

### P0-7 · OpenAPI contract + generated types — `DONE`
- **Deps:** P0-3 · **Scope:** `portfolio-api/docs/openapi.yaml`, `portfolio-app/src/app/core/api/openapi.yaml`, generated `contract.ts`
- **Goal:** add gym schemas + Phase-1 paths to the spec; regenerate app types.
- **Acceptance:** `TYPES` produces a clean, committed `contract.ts`; spec lints.
- **Verify:** `TYPES` · **Evaluator focus:** contract matches §4 endpoints; no hand-edited generated file.

### P0-8 · Frontend gym feature scaffold — `DONE`
- **Deps:** P0-1 · **Scope:** `portfolio-app/src/app/features/gym/**`, `app.routes.ts`, header nav
- **Goal:** lazy `/gym` route → placeholder dashboard component; nav entry; `gym.store` skeleton; `core/api/gym-api.ts` seam.
- **Acceptance:** `/gym` loads lazily, renders a placeholder, a11y-clean; FE-CHECK green.
- **Verify:** `FE-CHECK` · **Evaluator focus:** lazy-loaded, OnPush, conventions honored, nothing eager-imported.

---

## Phase 1 — Vertical slice  *(outcome: log a workout → see it on the dashboard)*

> **Applies to every backend step below (P1-1…P1-4) — enforced by the evaluator.**
> Data access is through a **Repository interface** in `app/Contracts` with an
> Eloquent implementation bound in a ServiceProvider; Services inject the
> interface; controllers stay thin and never touch Eloquent (see
> `CONVENTIONS.md` → "Repository pattern"). **Test coverage per the "Testing
> standard"**: Feature test (happy + error/validation + token gating) **and** a
> Service unit test **and** a Repository integration test (`RefreshDatabase`, on
> Postgres for stats/window-function queries). A step is not `DONE` without all
> three where they apply.

### P1-1 · GET /gym/exercises — `DONE`
- **Scope:** controller/service/repo/resource/request for catalog list + filters (muscle, equipment, category).
- **Acceptance:** returns seeded catalog; filters work; feature test; envelope; BE-CHECK.
- **Evaluator focus:** layering + Form Request validation + Resource shape.

### P1-2 · POST /gym/sessions — `DONE`
- **Scope:** create session + nested set entries; validation; `is_pr` + `personal_records` computed in service; **`cycle_day` accepted**.
- **Acceptance:** valid payload persists session+sets; PR detection correct on a fixture; invalid payload → 422 in the standard error shape; feature test; BE-CHECK.
- **Evaluator focus:** PR/volume computed server-side; grams stored; no logic in controller.

### P1-3 · GET /gym/sessions (list + detail) — `READY`
- **Scope:** paginated list (date-range filter) + `GET /{id}`.
- **Acceptance:** pagination + range filter tested; envelope; BE-CHECK.
- **Evaluator focus:** N+1 avoided (eager load); Resource shape stable.

### P1-4 · GET /gym/stats/overview — `READY`
- **Scope:** aggregates — total volume (all-time + this week + delta), PR count, streak, weekly frequency — **in SQL**.
- **Acceptance:** numbers verified against a known fixture session set; computed via SQL not PHP loops; test; BE-CHECK.
- **Evaluator focus:** SQL aggregation; `SUM(reps*weight_grams)` correct; timezone-safe week bucketing.

### P1-5 · Frontend api client + store — `BLOCKED` (P0-8, P1-1)
- **Scope:** `gym-api.ts` (typed, one seam) + `gym.store` (SignalStore: catalog, sessions, stats).
- **Acceptance:** store loads catalog + stats via generated types; unit test on a selector; FE-CHECK.
- **Evaluator focus:** uses generated contract types; SignalStore shape matches ThemeStore idiom.

### P1-6 · Logging form — `BLOCKED` (P1-5, P1-2)
- **Scope:** `features/gym/log/*` — Reactive form, fully selectable (exercise search-select, sets/reps/weight steppers, RPE/tempo/rest optional, unit toggle, cycle-day optional), "repeat last set", notes = only free text; submits → POST.
- **Acceptance:** logs a session in a few interactions; keyboard-only operable; AXE clean; component test; FE-CHECK.
- **Evaluator focus:** everything-selectable rule; Reactive forms; a11y; matches spec §6.1.

### P1-7 · History list + detail — `BLOCKED` (P1-5, P1-3)
- **Scope:** `features/gym/history/*` — session list + detail view.
- **Acceptance:** shows real logged sessions incl. cycle-day + notes; a11y; test; FE-CHECK.
- **Evaluator focus:** OnPush, native control flow, no data massaging in template.

### P1-8 · Dashboard: volume tile + trend chart — `BLOCKED` (P1-4, P1-5)
- **Scope:** `features/gym/dashboard/*` — total-volume stat tile + volume-over-time chart on real `/stats` data; Apple-style; light+dark.
- **Acceptance:** tile + chart render real data; dark/light parity; contrast passes; test; FE-CHECK. Read the **dataviz** guidance before choosing colors/marks.
- **Evaluator focus:** design-system coherence, accessible chart, no hard-coded numbers.

### P1-9 · Slice DoD gate — `BLOCKED` (P1-6..8)
- **Scope:** end-to-end pass on `/gym`; AXE audit; README/roadmap tick.
- **Acceptance:** full flow (log → history → dashboard) works on a fresh DB+seed; all checks green; STEP-LOG updated.
- **Evaluator focus:** the slice is genuinely end-to-end, not mocked.

---

## Phase 2 — Full dashboard  *(group — decompose on arrival)*
Per-exercise progression + PR markers · muscle-group balance · frequency heatmap ·
Apple-style polish pass (motion, spacing, type scale) in light/dark. Each chart =
its own atomic step with a dataviz + a11y acceptance criterion.

## Phase 3 — Trainer + programs  *(group)*
`ResolveShareLink` middleware + token gen/revoke · coach program builder
(blocks/items/resources) · athlete-side program viewer · link attachments now,
R2/Supabase uploads as a sub-step · **legacy importer** consuming the corpus per
`PARSING.md` with an `import_review` queue and golden-file tests.

## Phase 4 — AI layer  *(group)*
`LlmClient` interface + Groq binding · **progress-coach** agent (read tools, SSE
stream) + eval · **program-drafter** (schema-validated draft) + eval ·
**NL-logging** agent over `PARSING.md` (corpus = eval set) · talking-head recap
(labeled stretch; free/self-hosted path) · i18n (Ukrainian first) pass.

---

## Backlog / cross-cutting (schedule into phases, don't forget)
- **i18n Ukrainian-first** — the athlete logs in Ukrainian; catalog + UI need UK strings from the start (fold into P0-6 naming + a Phase-2/4 i18n step).
- **Cycle-day analytics** — once data exists, cycle-day is a real training variable worth a chart (Phase 2+).
- Rate-limiting + graceful degradation for AI endpoints (Phase 4).
- CORS locked to the Vercel origin (verify in P0-3).
