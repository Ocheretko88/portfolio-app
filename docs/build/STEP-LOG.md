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
## P1-3 — GET /gym/sessions (list + detail)            2026-07-27
Executor: Claude (Sonnet, cloud session)   Evaluator: Claude (Opus subagent)   Verdict: PASS
Commit: portfolio-api feat(gym): add GET /gym/sessions list+detail endpoints [P1-3] (pending user push)
What changed: `SessionRepository::paginate()` (date-range filter via `whereDate`
on `performed_at`, either bound optional, newest-first + id tiebreak, eager
`with('setEntries')`, real `LengthAwarePaginator`) + `SessionRepository::
findOrFail()` (eager-loaded, lets `ModelNotFoundException` bubble to the
existing global handler for the standard 404 envelope — no per-endpoint 404
code) on both the `SessionRepository` contract and its Eloquent impl +
`SessionService::list()`/`find()` (thin passthroughs) + `App\Http\Requests\Gym\
ListSessionsRequest` (from/to/page/perPage, `to` must be `after_or_equal:from`)
+ `WorkoutSessionResource::collection()` (additive, mirrors `SetEntryResource`'s
existing pattern — `fromModel()` untouched) + `sessions()`/`session()` controller
actions + 2 new routes (`GET /gym/sessions`, `GET /gym/sessions/{id}`).
Criteria: all MET — pagination + inclusive date-range filter verified at
repository, service, and endpoint layers; envelope carries all six
`PaginationMeta` fields on the list route; N+1 verified empirically by the
evaluator (3 queries total for 5 sessions × 3 sets, not 1+N); Resource shape
stable (no existing field touched); 14 new tests (6 Feature + 5 Repository + 3
Service), 62/62 full suite, 0 regressions; Pint clean.
Checks: `php artisan test` 62/62 (full suite, real Postgres 16); `pint --test`
clean — both independently re-run by the evaluator, not taken from the
executor's paste.
Notes / decisions: Evaluator flagged three non-blocking risk notes for later
steps: (1) `ListSessionsRequest`'s `after_or_equal:from` rejects an inverted
range with 422 rather than silently returning empty — stricter than the OpenAPI
spec, which is silent on the case; worth confirming the P1-6/7 frontend expects
a 422 there. (2) `perPage > 100` is rejected (422) rather than clamped —
defensible, but pin the behavior in the contract if a client ever needs the
clamp instead. (3) The "Service unit test" for this slice runs against the real
container + DB (integration-style, matching the P1-2 precedent already in the
same test file) rather than a mocked repository — flagged as a whole-suite
naming/precedent question for a future cleanup pass, not drift introduced by
this step.

## P1-2 — POST /gym/sessions            2026-07-27
Executor: Claude (Sonnet, cloud session)   Evaluator: Claude (Opus subagent)   Verdict: PASS
Commit: portfolio-api feat(gym): add POST /gym/sessions with server-side PR detection [P1-2] (pending user push)
What changed: `App\Contracts\{SessionRepository,PersonalRecordRepository}` +
`App\Repositories\Eloquent{Session,PersonalRecord}Repository` +
`App\Services\SessionService` (persists a session + set entries in one
transaction, then computes PRs) + `App\Http\Requests\Gym\CreateSessionRequest`
(validates against the P0-7 `CreateSessionRequest` schema; `id`/`isPr` never
accepted from the client) + `App\Http\Resources\Gym\{SetEntry,WorkoutSession}
Resource` (camelCase, matching the OpenAPI schemas exactly) + the
`createSession` controller action + 2 new provider binds + the route.
PR types (all per-exercise, non-warmup sets only): `max_weight`, `max_reps`,
`est_1rm` (Epley, rounded to nearest gram) are set-level — the winning
`SetEntry` gets `is_pr=true`; `max_volume` is a session-aggregate
(Σ reps×weight_grams across the session's sets for that exercise) and isn't
tied to one set (`set_entry_id` null). Historical-best lookups are `MAX(value)`
SQL aggregates in the repository, not PHP loops over stored history — only the
handful of sets in the current request are compared in PHP.
Criteria: all MET — valid payload persists session+sets (verified via
`assertDatabaseHas`); PR detection verified against a hand-computed fixture
(Epley 70000×(1+6/30)=84000, volume 8×60000+6×70000+10×50000=1,400,000, both
independently re-derived by the evaluator); a weaker follow-up session creates
zero new records; warmup sets never considered; 422s use the real
`{error:{code,message,details}}` envelope (unknown exerciseId, negative
weight, missing required fields); Feature + Service + 2 Repository integration
tests, all against real Postgres 16.
Checks: `php artisan test` 48/48 (full suite); `pint --test` clean.
Notes / decisions: Found and fixed a real bug mid-cycle — `$setData + ['set_number' => ...]`
(array-union) doesn't fill in a key that already exists with value `null`
(only genuinely-missing keys), so the Form Request's always-present
`set_number` key silently defeated the fallback and inserts hit a NOT NULL
violation. Fixed to `??=`. Evaluator independently confirmed the fix and found
no sibling instances of the same bug elsewhere in the request-shaping code.
Risk notes carried forward (non-blocking): PR detection runs outside the
session-creation DB transaction — a later failure there could leave a
committed session with partial/missing PR rows (self-healing for set-level
types on the next session; `max_volume` history would have a permanent gap).
Any future bulk/import session-creation path (Phase 3 importer) would bypass
PR detection entirely unless it's explicitly wired through `SessionService`
too — worth flagging when that step lands.

## P1-1 — GET /gym/exercises            2026-07-27
Executor: Claude (Sonnet, cloud session)   Evaluator: Claude (Opus subagent)   Verdict: PASS
Commit: portfolio-api feat(gym): add GET /gym/exercises endpoint [P1-1] (pending user push)
What changed: `App\Contracts\ExerciseRepository` (interface) +
`App\Repositories\EloquentExerciseRepository` (filters by primary_muscle,
whereJsonContains('equipment', ...), category — each applied only when
present) + `App\Services\ExerciseService` (thin passthrough) +
`App\Http\Requests\Gym\ListExercisesRequest` (Rule::in for category) +
`App\Http\Resources\Gym\ExerciseResource` (static fromModel/collection,
camelCase matching the P0-7 OpenAPI Exercise schema exactly) + a new
`exercises()` action on `GymController` + the `ExerciseRepository` bind in
`AppServiceProvider` + the route. Reused the existing app/{Contracts,
Repositories,Services,Http} structure per the P0-3 precedent (no app/Domain
tree).
Criteria: all MET — seeded catalog returned; muscle/equipment/category filters
verified (AND semantics, empty-result case); Feature test (happy path +
envelope + 3 filters + 422 in the real `{error:{code,message,details}}` shape,
not Laravel's default); Service test (container-resolved, proves the bind);
Repository integration test (RefreshDatabase, real Postgres 16, JSON
containment verified both directions).
Checks: `php artisan test` 35/35 (full suite, incl. 25 pre-existing); Gym-only
filter 22/22; `pint --test` clean (verified non-vacuous by pointing Pint at a
deliberately malformed file first). Verified against a real local Postgres 16,
not sqlite — matches what CI now runs after the P0-2 CI fix.
Notes / decisions: Evaluator flagged (non-blocking) that the Service/Repository
test split is thin because `ExerciseService::catalog` is a pure passthrough —
acceptable here per repo precedent (`ResumeServiceTest`), but flagged that
P1-2/P1-4 (where services hold real logic — PR detection, SQL aggregation)
need a stricter split, not a passthrough-style test. Endpoint test builds rows
via factory, not the real seeder — acceptable since `ExerciseCatalogSeederTest`
already covers seeder correctness separately.

---
## P0-7 — OpenAPI contract + generated types            2026-07-27
Executor: Claude (Sonnet, cloud session)   Evaluator: Claude (Opus subagent, 3 rounds)   Verdict: PASS
Commit: portfolio-api feat(gym): add Phase-1 gym endpoints + schemas to OpenAPI contract [P0-7]
        portfolio-app feat(gym): regenerate contract.ts from Phase-1 gym OpenAPI spec [P0-7]
What changed: Added 4 paths (`GET /gym/exercises`, `GET`+`POST /gym/sessions`,
`GET /gym/sessions/{id}`, `GET /gym/stats/overview`) and 9 schemas (`Exercise`,
`SetEntry`, `SetEntryInput`, `WorkoutSession`, `CreateSessionRequest`,
`StatsOverview`, `PaginationMeta`, `ExerciseCategory`, `WeightUnit`) to
`portfolio-api/docs/openapi.yaml`, matching P1-1..P1-4 exactly (not the full §4
table — PATCH/DELETE sessions and later-phase routes correctly excluded, no P1
step covers them yet). Mirrored byte-identically to
`portfolio-app/src/app/core/api/openapi.yaml`. Regenerated `contract.ts` with
the real `openapi-typescript` v7.13.0 CLI.
Criteria: all MET — TYPES clean (byte-identical to fresh regeneration), spec
lints (0 struct/parse errors on 3.1; only pre-existing rule classes —
security-defined, license, 4xx-response — scale proportionally with new
endpoints, same as baseline), contract matches §4 endpoints for P1-1..P1-4, no
hand-edited generated file.
Checks: typecheck clean; vitest 12/12; format:check clean (incl. regenerated
contract.ts after `prettier --write`); build fails only on the pre-existing
Google Fonts inline step (sandbox has no route to fonts.googleapis.com — same
caveat as P0-8's log entry, unrelated to this diff).
Notes / decisions: Evaluator round 1 caught a real defect — `nullable: true` is
an OpenAPI 3.0 keyword invalid under this spec's declared `3.1.0`; fixed to JSON
Schema 2020-12 type unions (`type: [string, 'null']`) across 19 fields.
Evaluator round 2 caught that the fix existed only in a cloud scratch copy and
was never written to the real files on the user's device — corrected by writing
through the device-commit path and re-verifying directly on-device. Also found
(and fixed by regenerating): the previously committed `contract.ts` was not
genuine tool output — it only had `components.schemas`, missing the
`paths`/`operations` interfaces `openapi-typescript` always emits, meaning a
prior session had hand-written/hand-trimmed a "generated" file (a
CONVENTIONS.md hard-list violation). `PaginationMeta` duplicates `Meta`'s two
fields rather than composing via `allOf` — flagged as a risk note, not a
blocker (harmless while `Meta` is stable). Separately (reported by the user,
fixed alongside): CI was broken since P0-2 — the Neon default-connection switch
left `phpunit.xml` pointing pgsql at `DB_DATABASE=:memory:` with no Postgres
service in CI and no `pdo_pgsql` extension. Added a `postgres:16` service +
extension to `.github/workflows/ci.yml` and corrected the test env vars;
verified 25/25 backend tests + Pint clean against a real local Postgres 16
before handing the fix back.

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
