# TASKS — the build ledger

Single source of truth for progress. The executor works the **first step whose
status is `READY`** (all deps `DONE`). Statuses: `READY` · `IN_PROGRESS` ·
`BLOCKED` · `DONE`. Only an EVALUATOR **PASS** flips a step to `DONE`.

Each step is deliberately small enough to implement and verify in one cycle.
Phases P0–P2 are fully decomposed (build these next). P3–P4 are step *groups* —
decompose the group into atomic steps (same template) when you reach it; do not
pre-expand far-future work.

**Verify command legend**
`FE-CHECK` = `npm run typecheck && npm test && npm run format:check && npm run build`
`BE-CHECK` = `composer test && ./vendor/bin/pint --test`
`TYPES` = `npm run api:types` (clean, no diff beyond intended)

---

## Verification snapshot — 2026-07-28 (independent audit)

Re-run from scratch against the committed code rather than trusting the
STEP-LOG. Both repos at `b2210a2` (api) / `b95d353` (app); working trees clean;
app `HEAD` matches `origin/main`, so nothing is stranded locally.

| Check | Result |
|---|---|
| `php artisan test` (real Postgres 16, fresh DB) | **77 passed**, 407 assertions |
| `./vendor/bin/pint --test` | **passed** |
| `php artisan migrate:fresh` on an empty Postgres | clean, all 10 gym tables |
| `ExerciseCatalogSeeder` run twice | idempotent, **72 exercises** |
| `npm run typecheck` | clean |
| `npm test` | **28 passed** (6 files) |
| `npm run format:check` | clean |
| `npm run build` | fails **only** on the Google Fonts inline → fixed by H-2 |
| `npm run api:types` | regenerates, then leaves a **dirty tree** → fixed by H-1 |

**Verdict:** P0-1…P1-6 are genuinely done — the backend slice is real, layered,
SQL-aggregated and tested; the frontend slice type-checks, tests and formats
clean. Two *process* gates are broken rather than the code (H-1, H-2), and
three real gaps had no step at all (H-3, H-4, H-5). They are scheduled below as
**Phase 1.5**, ahead of Phase 2.

Not verifiable from the audit sandbox — open items for you:

- whether the **deployed** Render API serves `/api/v1/gym/*` off Neon, and
  whether the Neon DB has been seeded (no outbound route to `onrender.com`
  here). Folded into P1-9.
- whether GitHub Actions is green on `main` for both repos.

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
- **Deps:** P0-1 · **Scope (as built):** `app/Http/Controllers/Api/GymController.php`, `app/Http/{Requests,Resources}/Gym/**`, `app/Services/*`, `app/Repositories/Eloquent*`, `app/Contracts/*`, `app/Models/Gym/**`, `routes/api.php` (`/api/v1/gym` group), `app/Providers/AppServiceProvider.php`
- **Path correction (2026-07-28):** the spec (§2, §4) and this step originally said `app/Domain/Gym/**`. The code landed in the repo's existing flat Laravel layering instead — which `CONVENTIONS.md` explicitly permits ("gym under `app/Domain/Gym` **or** `app/Services` consistent with the repo's existing placement") and which is the better call, since it keeps one layering story across the whole API rather than two. Audited and accepted; the scope line above now reflects reality. **Follow-up:** H-6 records it as an ADR so the spec and the code stop disagreeing.
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
- **Audited 2026-07-28:** re-verified on a fresh Postgres — seeder is idempotent, exactly **72** exercises after two runs. ✅
- **Still pending on your machine:** run the seeder once against your real Neon DB (`php artisan db:seed --class=ExerciseCatalogSeeder`) to populate those 72 exercises — the migrations are run, but seeding is a separate step. Now tracked as an explicit acceptance line in **P1-9**.

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

### P1-3 · GET /gym/sessions (list + detail) — `DONE`
- **Scope:** paginated list (date-range filter) + `GET /{id}`.
- **Acceptance:** pagination + range filter tested; envelope; BE-CHECK.
- **Evaluator focus:** N+1 avoided (eager load); Resource shape stable.

### P1-4 · GET /gym/stats/overview — `DONE`
- **Scope:** aggregates — total volume (all-time + this week + delta), PR count, streak, weekly frequency — **in SQL**.
- **Acceptance:** numbers verified against a known fixture session set; computed via SQL not PHP loops; test; BE-CHECK.
- **Evaluator focus:** SQL aggregation; `SUM(reps*weight_grams)` correct; timezone-safe week bucketing.

### P1-5 · Frontend api client + store — `DONE`
- **Scope:** `gym-api.ts` (typed, one seam) + `gym.store` (SignalStore: catalog, sessions, stats).
- **Acceptance:** store loads catalog + stats via generated types; unit test on a selector; FE-CHECK.
- **Evaluator focus:** uses generated contract types; SignalStore shape matches ThemeStore idiom.

### P1-6 · Logging form — `DONE`
- **Scope:** `features/gym/log/*` — Reactive form, fully selectable (exercise search-select, sets/reps/weight steppers, RPE/tempo/rest optional, unit toggle, cycle-day optional), "repeat last set", notes = only free text; submits → POST.
- **Acceptance:** logs a session in a few interactions; keyboard-only operable; AXE clean; component test; FE-CHECK.
- **Evaluator focus:** everything-selectable rule; Reactive forms; a11y; matches spec §6.1.

### P1-7 · History list + detail — `READY` (P1-5, P1-3)
- **Scope:** `features/gym/history/*` — session list + detail view; `core/state/gym.store.ts` + `core/api/api-client.ts` as needed for the two additions below.
- **Acceptance:** shows real logged sessions incl. cycle-day + notes; a11y; test; FE-CHECK.
- **Added 2026-07-28 (found in audit, both blocking a correct list view):**
  1. **Pagination meta must reach the UI.** `ApiClient` unwraps only `data`, so the `{page, perPage, total, totalPages}` the server already returns is thrown away. Surface it (envelope-aware method or a `meta` passthrough) and drive real pagination controls with it — do not re-derive page counts client-side.
  2. **Error state must be distinguishable from empty.** `GymStore`'s three loaders `catchError` to `[]`/`null`, so a failed request renders as "no sessions". Add an `error` field to the store and an inline retry affordance; assert both paths in the spec.
- **Evaluator focus:** OnPush, native control flow, no data massaging in template; "no results" and "request failed" are visibly different states.

### P1-8 · Dashboard: volume tile + trend chart — `READY` (P1-4, P1-5)
- **Scope:** `features/gym/dashboard/*` — total-volume stat tile + volume-over-time chart on real `/stats` data; Apple-style; light+dark. Replaces the current placeholder component (which still renders `store.status()` — a scaffold field nothing ever sets to `ready`; drop it or make it meaningful).
- **Acceptance:** tile + chart render real data; dark/light parity; contrast passes; test; FE-CHECK. Read the **dataviz** guidance before choosing colors/marks.
- **Evaluator focus:** design-system coherence, accessible chart, no hard-coded numbers.

### P1-9 · Slice DoD gate — `BLOCKED` (P1-6..8, H-1..H-5)
- **Scope:** end-to-end pass on `/gym`; a11y audit; README/roadmap tick.
- **Acceptance:** full flow (log → history → dashboard) works on a fresh DB+seed; all checks green; STEP-LOG updated.
- **Added 2026-07-28 — the gate is not passable until the deployment is real:**
  - `ExerciseCatalogSeeder` has been run against the **live Neon** DB (72 rows present).
  - The **deployed** Render API answers `GET /api/v1/gym/exercises` and `/gym/stats/overview` with the envelope (not 404/500), and `POST /gym/sessions` persists to Neon.
  - The Vercel build serves `/gym` and `/gym/log` against that API (CORS to the Vercel origin verified, per the Phase-0 note).
  - CI is green on `main` in **both** repos.
- **Evaluator focus:** the slice is genuinely end-to-end and genuinely deployed, not mocked and not localhost-only.

---

## Phase 1.5 — Hardening  *(new, 2026-07-28 — do before Phase 2)*

> These come out of the independent audit. H-1 and H-2 fix **verification gates
> that have been silently red since P0-7** — every step since has waived them in
> its STEP-LOG entry, which is exactly the drift this harness exists to prevent.
> H-3…H-5 are real gaps the plan never contained a step for. Small, each one
> cycle. Do them before Phase 2 widens the surface.

### H-1 · Make `npm run api:types` leave a clean tree — `DONE`
- **Scope:** `portfolio-app/package.json` (the `api:types` script).
- **Problem:** `openapi-typescript` emits double-quoted output; the committed `contract.ts` is Prettier-formatted (single quotes). A fresh `npm run api:types` therefore rewrites all 1224 lines and dirties the tree — so the `TYPES` gate ("clean, no diff beyond intended") can never literally pass, and a genuine contract drift would hide inside the noise. Confirmed: after `prettier --write` on the regenerated file the diff is **empty**, so the committed types *are* correct today.
- **Goal:** chain the formatter into the script (`openapi-typescript … && prettier --write src/app/core/api/generated/contract.ts`).
- **Acceptance:** on a clean checkout, `npm run api:types` → `git status` reports **no** modified files; `npm run format:check` still clean.
- **Verify:** `TYPES` then `git status --short` (must be empty) · **Evaluator focus:** the gate is now honest; no generated file hand-edited.

### H-2 · Self-host the web fonts — `DONE`
- **Scope:** `portfolio-app/src/styles.css`, `public/fonts/**` (or an `@fontsource` dev-dep), `index.html`.
- **Problem:** `styles.css` `@import`s Inter + JetBrains Mono from `fonts.googleapis.com`, and Angular's font-inlining plugin fetches that URL **at build time**. Any environment without an outbound route to Google (this audit sandbox, every prior build sandbox, an offline laptop, a locked-down CI runner) fails `npm run build` with a 403 — which is why *every* step since P0-7 recorded "build fails, known sandbox issue". The build gate is effectively unverified outside GitHub Actions.
- **Goal:** ship the two families from the app's own origin so the production build is hermetic.
- **Acceptance:** no `fonts.googleapis.com` reference remains; `npm run build` succeeds with **no network**; identical rendering in light + dark; bundle-size delta recorded in the STEP-LOG.
- **Verify:** `FE-CHECK` with networking disabled · **Evaluator focus:** build is hermetic; no FOUT regression; licenses (both are OFL) shipped.

### H-3 · Real a11y assertions, not manual review — `READY` (no deps)
- **Scope:** `portfolio-app` dev-deps (`axe-core`), a small `testing/a11y.ts` helper, `log-form.spec.ts` + `dashboard.spec.ts`.
- **Problem:** `CONVENTIONS.md` makes AXE a hard gate and the DoD repeats it, but **no axe tooling exists in the repo** — every UI step so far passed on "AXE clean by manual review". A gate nothing can fail is not a gate.
- **Goal:** one helper that runs axe against a rendered fixture and fails the test on violations; wire it into the existing component specs.
- **Acceptance:** helper exists and is used by ≥2 specs; a deliberately broken label makes a test **fail** (demonstrate it, then revert); `npm test` green; runs in CI.
- **Verify:** `FE-CHECK` · **Evaluator focus:** violations actually fail the suite; the helper covers both themes if feasible.

### H-4 · Guard the write endpoint — `READY` (no deps)
- **Scope:** `portfolio-api`: `routes/api.php`, a small middleware, `config/`, `.env.example`, `render.yaml`, tests; ADR in `portfolio-app/docs/adr/`.
- **Problem:** `POST /api/v1/gym/sessions` is currently open to anyone who finds the URL, under the default `throttle:api` only. Spec §9 knowingly accepts *read* obscurity for a personal MVP — it never accepted anonymous **writes**, and a public write endpoint is the one thing a senior reviewer will flag on sight. (Related, lower stakes: session IDs are sequential bigints, not the spec's UUIDs, so records are enumerable — decide and record, don't drift.)
- **Goal:** a shared-secret header check (`X-Gym-Token`, env-configured) on the mutating routes + a dedicated tighter throttle; reads stay open. Deliberately the same shape as the Phase-3 `ResolveShareLink` middleware so that work slots in rather than replaces this.
- **Acceptance:** POST without/with a wrong token → 401 in the standard error envelope; with the token → 201; reads unaffected; feature test covers all three; secret only via env (`sync:false`); ADR records both the write-guard decision **and** the bigint-vs-UUID id choice.
- **Verify:** `BE-CHECK` · **Evaluator focus:** no secret committed; middleware is thin; error envelope reused, not reinvented.

### H-5 · Session edit + delete — `READY` (H-4)
- **Scope:** `portfolio-api` controller/service/repo/request for `PATCH /gym/sessions/{id}` + `DELETE /gym/sessions/{id}`; `docs/openapi.yaml`; regenerate app types.
- **Problem:** both are in spec §4 but appear **nowhere** in this ledger — an oversight, not a deferral. P1-7's detail view has no way to fix a mistyped set, which is the first thing you'll want after logging for real.
- **Goal:** the two endpoints, behind the H-4 guard, with PR/`personal_records` recomputed on edit and cleaned up on delete.
- **Acceptance:** PATCH updates session + nested sets and **recomputes** `is_pr`/`personal_records` (a downgraded lift must lose its PR); DELETE removes session + sets and any PR rows that pointed at them; 404 on unknown id; feature + service + repository tests; contract updated and `TYPES` clean.
- **Verify:** `BE-CHECK` + `TYPES` · **Evaluator focus:** PR recomputation is correct (the easy bug is leaving a stale PR behind); no logic in the controller.

### H-7 · Versioned git hooks, both repos — `DONE`
- **Scope:** `.githooks/{_lib.sh,pre-commit,commit-msg,pre-push,README.md}` in **both** repos; `package.json` (`prepare`, `hooks:install`); `composer.json` (`post-install-cmd`).
- **Goal:** make the Definition of Done enforceable instead of aspirational, and make it survive a fresh clone — `.git/hooks` is per-clone and silently absent for everyone who did not set it up, so hooks live in a versioned directory and `core.hooksPath` is pointed at it by `npm install` / `composer install`.
- **Acceptance:** every rule fires on a real violation and stays quiet on legitimate work; `pre-commit` under ~2s; `pre-push` runs the full DoD; a fresh clone gets the hooks with no manual step.
- **Evaluator focus:** no rule that is not already written down in `CONVENTIONS.md`, an ADR or the DoD — hooks are enforcement, not new policy.

### H-8 · Agent guards (`PreToolUse`) — `DONE`
- **Scope:** `.claude/settings.json` + `.claude/hooks/{guard-write.sh,guard-bash.sh}` in both repos.
- **Goal:** git hooks protect the repository; these protect the **working tree from the agent**, one tool call earlier — and, crucially, stop an agent from disarming the other layers (`--no-verify`, `core.hooksPath`).
- **Acceptance:** blocked calls exit 2 with a reason the model can act on; no false positive on ordinary edits; fails **open** on malformed input.
- **Evaluator focus:** adversarial — try to spell the forbidden command in a way that slips through.

### H-9 · CI re-asserts the invariants — `DONE` (app) · `READY` (api + branch protection)
- **Scope:** `portfolio-app/.github/workflows/ci.yml` (done); the api workflow and GitHub branch protection (open).
- **Goal:** a hook can be skipped with `--no-verify`; CI is the copy nobody can bypass, so the invariants that matter are asserted there too — contract-type drift, and a repo-wide sweep for focused/skipped tests, `debugger`, and the banned Angular idioms.
- **Remaining:** mirror the drift/invariant job in the api workflow, and turn on branch protection for `main` in both repos (require PR + green CI). Branch protection is a GitHub settings change only you can make — without it, every layer above is advisory.

### H-10 · Environment checks in the hooks — `DONE`
- **Scope:** `portfolio-app/.nvmrc`, `package.json` (`engines`), `.githooks/_lib.sh` (`load_nvm`, `ensure_node`), both `pre-push` hooks, app `pre-commit`.
- **Why:** the first real push after H-7 failed with a `yargs-parser` stack trace, because the shell was on Node 18 and Angular 21 needs ≥20.19 — and the api push failed with 63 red tests, because no Postgres was listening. Neither was a code problem, but the hook reported both as "typecheck failed" / "tests failed". **A check that cannot run is not a check that failed, and reporting the two the same way is exactly what teaches people to reach for `--no-verify`.**
- **What:** Node 22 pinned in `.nvmrc` and stated in `engines`; the hooks source nvm themselves (git hooks run in a non-interactive shell where it is otherwise absent) and honour `.nvmrc`; `pre-push` verifies the Node version and, on the api, that something is actually listening on the `phpunit.xml` database host/port — each failing with the environment named and the exact fix printed.
- **Verified:** simulated Node 18 → the environment message, not a stack trace; Postgres stopped → the database message; Postgres started → full suite runs and the push passes.

### H-11 · Disposable test database — `DONE`
- **Scope:** `portfolio-api/compose.yaml`, `composer.json` (`test-db`, `test-db:stop`), `.githooks/pre-push` message, `.githooks/README.md`.
- **Why:** the real data lives in Neon and `.env` points there, but the suite runs `RefreshDatabase`/`migrate:fresh` — aimed at Neon that would **drop and recreate the training history**. `phpunit.xml` already blanks `DB_URL` and pins `127.0.0.1`; this gives that pin something to connect to, in the repo rather than in someone's shell history.
- **What:** one service, `postgres:16-alpine`, credentials matching `phpunit.xml`, bound to **loopback only**, storage on a **RAM disk** with `fsync`/`synchronous_commit`/`full_page_writes` off — the database cannot outlive the container, no state leaks between runs, and the suite runs faster. `composer run-script test-db` starts it and waits for the healthcheck.
- **Acceptance:** `docker compose config` validates; `composer run-script test-db && php artisan test` is green from cold; the `pre-push` environment message names this command.
- **Note:** check the api CI's Postgres service version matches `postgres:16` — a driver difference between local and CI is the kind of thing that only shows up in a window-function query.

### H-6 · Reconcile the spec with the code — `READY` (no deps)
- **Scope:** `portfolio-app/docs/gym-tracker-architecture.md` (§2 diagram, §4 intro), new ADR.
- **Goal:** the spec still says gym code lives in `app/Domain/Gym/`; it lives in the repo's flat layering (see the P0-3 correction). Update the two references and record the placement decision as an ADR so the next executor doesn't "fix" the code toward a stale doc.
- **Acceptance:** no `app/Domain/Gym` reference survives except as a noted superseded option; ADR added in the existing numbered format, status Accepted; no code changes.
- **Verify:** n/a (docs) · **Evaluator focus:** doc now matches reality; ADR states the trade-off, not just the outcome.

---

## Phase 2 — Full dashboard  *(decomposed 2026-07-28)*

> Each chart is its own step, backend-then-frontend, and every UI step inherits
> the **dataviz** guidance (read it before picking colors/marks) plus the H-3
> axe assertion. No chart ships on client-side aggregation — the SQL side comes
> first, deliberately, because that is the part reviewers look at.

### P2-1 · `GET /gym/stats/exercises/{id}` — progression series — `BLOCKED` (P1-9)
- **Scope:** `portfolio-api` stats repo/service/controller + contract.
- **Goal:** per-exercise time series — per session: top-set weight, est. 1RM (Epley, labeled estimate), total volume — plus PR markers, all in SQL (window functions).
- **Acceptance:** series verified against a fixture; PR markers align with `personal_records`; empty-history → empty series not 500; feature + repo (Postgres) tests; `TYPES` clean.
- **Evaluator focus:** SQL aggregation with window functions, no PHP loops; date bucketing timezone-safe.

### P2-2 · Per-exercise progression chart — `BLOCKED` (P2-1)
- **Scope:** `features/gym/dashboard/*` — exercise picker + line chart with PR markers.
- **Acceptance:** picking a lift renders its series; PR markers legible in light **and** dark; keyboard-operable picker; axe clean; test; FE-CHECK.
- **Evaluator focus:** shares the P1-8 chart primitives rather than forking a second chart style.

### P2-3 · Muscle-group volume distribution (API) — `BLOCKED` (P1-9)
- **Goal:** volume by `primary_muscle` over a date window, in SQL; extend `/stats/overview` or add `/stats/muscles` — decide and note why.
- **Acceptance:** percentages sum correctly; window parameterised; tests; `TYPES` clean.

### P2-4 · Muscle-balance chart — `BLOCKED` (P2-3)
- **Acceptance:** renders real distribution; colour is not the only encoding (label/value too); axe clean; test; FE-CHECK.

### P2-5 · Training-frequency series (API) — `BLOCKED` (P1-9)
- **Goal:** sessions per day over a rolling year via `date_trunc('day', …)`, timezone-safe.
- **Acceptance:** gap days present as zeros; DST-safe; tests; `TYPES` clean.

### P2-6 · Frequency heatmap — `BLOCKED` (P2-5)
- **Acceptance:** GitHub-style calendar; **not** colour-only — semantic table markup or per-cell accessible text; contrast passes at every intensity in both themes; axe clean; test; FE-CHECK.

### P2-7 · Complete the stat-tile row — `BLOCKED` (P1-8)
- **Scope:** PRs this month · current streak · sessions this week (the `/stats/overview` fields already computed but unused).
- **Acceptance:** all tiles read real data; consistent tile component, not four bespoke ones; test; FE-CHECK.

### P2-8 · Apple-style polish pass — `BLOCKED` (P2-2, P2-4, P2-6, P2-7)
- **Scope:** motion, spacing, type scale across `/gym`, light + dark, per spec §6.2.
- **Acceptance:** one coherent visual system with the existing CV pages (shared tokens, no gym-only palette); `prefers-reduced-motion` respected; contrast audited; FE-CHECK.

### P2-9 · Phase-2 DoD gate — `BLOCKED` (P2-1..8)
- **Acceptance:** dashboard demo-able on real data; all checks green; STEP-LOG + README/roadmap updated; **cycle-day** data reviewed to decide whether it now warrants its own chart (backlog item).

---

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
- **Cycle-day analytics** — once data exists, cycle-day is a real training variable worth a chart (decision point is P2-9).
- Rate-limiting + graceful degradation for AI endpoints (Phase 4).
- CORS locked to the Vercel origin (re-verify in P1-9, not P0-3 — it needs the deployed origin).
- **"Same as last workout"** (spec §6.1) — deferred out of P1-6 because it needs history data; schedule right after P1-7.
- **Exercise search is not a real combobox** (P1-6 note) — the search input filters the `<select>`'s options without ARIA binding. Revisit in P2-8 polish.
- **`session notes` sits after the action buttons in tab order** (P1-6 note) — fix during P1-7 or P2-8.
- **Sequential bigint IDs vs the spec's UUIDs** — decided/recorded in H-4; revisit if share links ever expose session IDs (Phase 3).
- **No API pagination cap audit** — `perPage` bounds are validated, but confirm the list endpoint can't be asked for an unbounded page once real data exists.
