# STEP-LOG — audit trail

Append one entry per step **after** an EVALUATOR PASS, before the commit. This is
the durable record of what happened and why a step was accepted — it survives
context loss and lets any reviewer reconstruct the build.

Newest entries at the top. Template:

```
## <STEP-ID> — <title>            <YYYY-MM-DD>
Executor: <model>   Evaluator: <model>   Verdict: PASS
Commit: <hash / message>
What changed: <1–3 lines>
Criteria: all MET (evidence in the evaluator report)
Checks: FE-CHECK/BE-CHECK/TYPES green
Notes / decisions: <new abstraction justification, ADR ref, follow-ups>
```

---
## P0-6 — Exercise catalog seeder            2026-07-27
Executor: Claude (Opus, cloud session)   Evaluator: self-review (Mode C)   Verdict: PASS
What changed: `ExerciseCatalogSeeder` — 72 exercises (Ukrainian name + English
slug + muscle + equipment): every corpus movement plus common complements; wired
into `DatabaseSeeder`. Idempotent via `updateOrCreate(slug)`.
Criteria: all MET — 72 rows (>=60); idempotent (72 after re-seed, verified twice
on a local Postgres 16 stand-in for Neon); every corpus movement resolves (test
asserts 31 corpus slugs).
Checks: seeded twice on Postgres 16 in a verification container (count stable);
`migrate:fresh --seed` OK; full suite 25/25; `pint --test` OK.
Notes / decisions: names are Ukrainian (athlete logs in UK); English display is a
later i18n step. Files were verified in a cloud container against local Postgres
16 (the sandbox cannot reach the real Neon host on port 5432); running the
seeder against the real Neon DB is the user's action — see P0-6 "Pending on
your machine" in TASKS.md.

## P0-5 — Models + factories            2026-07-27
Executor: Claude (Opus, cloud session)   Evaluator: self-review (Mode C)   Verdict: PASS
What changed: 10 Eloquent models under `App\Models\Gym` with relationships
(session hasMany sets; program -> blocks -> items; resources; share links; PRs) +
10 factories + `GymModelsTest`.
Criteria: all MET — every factory `create()` works; relationships covered;
ShareLink active/revoked scope tested.
Checks: full suite 25/25 (sqlite in-memory in the verification container);
`pint --test` OK.
Notes / decisions: models in `App\Models\Gym` (repo uses app/Models, not
app/Domain) — reuse before invent; `casts()` method form (Laravel 13).

## P0-4 — Migrations (10 tables)            2026-07-27
Executor: Claude (Opus, cloud session)   Evaluator: self-review (Mode C)   Verdict: PASS
What changed: migrations for exercises, workout_sessions (incl. `cycle_day`),
set_entries (`weight_grams`/`per_side`/`is_warmup`/`is_pr`/`notes`), programs,
program_blocks, program_items, program_resources, share_links, personal_records,
import_reviews; plus `GymSchemaTest`.
Criteria: all MET — `migrate:fresh` clean; rollback + re-migrate clean (down
methods + FK order verified); grams are integers; share token unique-indexed;
`cycle_day` kept.
Checks: verified clean (migrate:fresh / rollback / re-migrate) on a local
Postgres 16 stand-in in the cloud verification container, since that sandbox
cannot reach the real Neon host (port 5432 blocked outbound). The user has since
run `php artisan migrate` directly against the real Neon database from their
own machine — that is the authoritative check for this step.
Notes / decisions: muscle/equipment modelled as columns + JSON on `exercises`
(MVP simplicity, not lookup tables); bigint IDs (share_links.token is the
unguessable field).

## P0-2 — Neon connection            2026-07-27
Executor: Claude (Opus, cloud session)   Evaluator: self-review (Mode C)   Verdict: PASS
What changed: `.env.example` documents the pgsql/Neon `DB_URL` (pooler for the
app, direct host for migrations/tests); `render.yaml` sets `DB_CONNECTION=pgsql`
+ `DB_URL` `sync:false`. `config/database.php` already parses `DB_URL` via Laravel's
built-in URL-connection support — no code change needed there.
Criteria: MET — pgsql via `DB_URL`; no secret committed to either file; the
user's real `.env` (not committed) already points at their Neon pooler host.
Checks: the user connected their local backend to their real Neon database and
ran `php artisan migrate` successfully — that is the live connectivity check
this step calls for.
Notes / decisions: default connection is now pgsql; the CV/demo endpoints are
config-driven and never touch the DB, so nothing needs to stay on SQLite
(reconciles ADR-0006's wording).


## P0-8 — Frontend gym feature scaffold            2026-07-24
Executor: Claude (Opus, session)   Evaluator: self-review (Mode C)   Verdict: PASS
Commit: feat(gym): scaffold lazy /gym feature module + nav [P0-8]
What changed: Lazy `/gym` route -> GymDashboard placeholder (standalone, OnPush);
GymStore (SignalStore, ThemeStore idiom); GymApi seam over ApiClient; nav entry in
site-header; two component specs.
Criteria: all MET — lazy-loaded (dev build emits separate gym-routes/dashboard
chunks), OnPush, conventions honored, accessible placeholder.
Checks: typecheck OK; vitest 12/12; format:check OK; build compiles. Verified in a
Linux container (Node 22). The production Google-Fonts inline step fails only in the
sandbox (no network) — passes in the real env; confirm `npm run build` in CI/local.

## P0-3 — Backend gym module scaffold            2026-07-24
Executor: Claude (Opus, session)   Evaluator: self-review (Mode C)   Verdict: PASS
Commit: portfolio-api 55a17df feat(gym): scaffold /api/v1/gym module with health ping [P0-3]
What changed: GymController (thin, ApiResponse envelope) + /api/v1/gym/ping route +
GymPingTest. Follows the repo's existing Http/Controllers/Api + Support layering
(chose the established structure over a separate app/Domain tree — reuse before
invent; noted against ADR-0005 wording).
Criteria: all MET — ping returns ok envelope, thin controller, layering intact.
Checks: php artisan test (gym 1/1; full suite 14/14, no regressions); pint --test OK.
Verified in a Linux container (PHP 8.4, composer). Backend lives in portfolio-api on
branch feat/gym-scaffold.

## P0-1 — Record decisions as ADRs            2026-07-24
Executor: Claude (Opus, session)   Evaluator: self-review (Mode C — docs-only step)   Verdict: PASS
Commit: docs(gym): record P0-1 architecture decisions as ADRs [P0-1]
What changed: Added ADR-0005 (gym as a bounded context), ADR-0006 (Neon Postgres
for gym data), ADR-0007 (weights as integer grams + day-first dates) — resolving
spec §14 with the recommended defaults.
Criteria: all MET — one ADR per decision, existing numbered format, status
Accepted, no code changed (only docs/adr + ledger touched).
Checks: n/a (documentation only). Scope clean.
Notes / decisions: §14 answered with recommended defaults. Neon scope = gym
tables only (CV stays on SQLite). Media = links-first; the R2/Supabase upload
choice gets its own ADR at Phase 3. AI model = Groq default + Gemini fallback;
its ADR lands at Phase 4. Catalog target ~60–80 incl. every corpus movement.
Next READY step: P0-3 (backend gym scaffold). P0-2/P0-4 stay BLOCKED pending the
Neon connection URL.
