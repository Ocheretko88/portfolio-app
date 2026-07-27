# Conventions & guardrails (non-negotiable)

The executor MUST obey these. The evaluator checks against them. They are
distilled from `portfolio-app/AGENTS.md`, the API README's layering, and the
architecture spec. "It compiled" is not permission to break these.

## Global

- **Reuse before invent.** Match existing patterns (`ResumeService`,
  `ThemeStore`, `ApiResponse`, `core/api/api-client.ts`). New abstractions need a
  one-line justification in the step's STEP-LOG entry.
- **Contract-first.** `portfolio-api/docs/openapi.yaml` is the source of truth.
  Change it first, copy to the app, run `npm run api:types`; never hand-write
  types that the generator owns.
- **Canonical units.** Weight stored as **integer grams**; display converts
  kg/lb. Never store floats for weight. Dates are day-first (see `PARSING.md`).
- **Record decisions.** Anything architectural gets an ADR in
  `portfolio-app/docs/adr/` (follow the existing numbered format).
- **Small commits.** One step = one focused commit, conventional message
  (`feat(gym): …`, `test(gym): …`), referencing the step ID.

## Frontend (Angular 21) — from AGENTS.md

- Standalone components; do **not** set `standalone: true` (it's the default).
- Signals for state; `computed()` for derived; `input()`/`output()` functions,
  not decorators. No `mutate` — use `set`/`update`.
- `ChangeDetectionStrategy.OnPush` on every component.
- Native control flow `@if`/`@for`/`@switch`; never `*ngIf`/`*ngFor`.
- **Reactive** forms (the log form especially); never template-driven.
- `class`/`style` bindings, never `ngClass`/`ngStyle`.
- No `@HostBinding`/`@HostListener` — use the `host` object.
- `NgOptimizedImage` for static images.
- Strict TS: no `any` (use `unknown`); prefer inference where obvious.
- Lazy-load the `/gym` feature route.
- Shared state → NgRx SignalStore (`withState/withComputed/withMethods`), same
  shape as `ThemeStore`. Local state stays a plain `signal()`.
- **Accessibility is a gate, not a nicety:** passes AXE, WCAG-AA contrast, focus
  management, keyboard operable, ARIA correct — in light **and** dark.

## Backend (Laravel 13) — from the API README

- Layering, strictly: `Route → Controller → Service → Repository(interface) →
  data source`. **No logic in controllers** — they delegate and return
  `App\Support\ApiResponse::ok(...)`.
- Business logic in `app/Services` (gym under `app/Domain/Gym` or `app/Services`
  consistent with the repo's existing placement).
- Repositories behind interfaces in `app/Contracts`, bound in a ServiceProvider
  (Dependency Inversion — mirror `ResumeRepository`).
- Input via **Form Requests**; output shape via **Resources**; one success
  envelope (`ApiResponse`) and the existing single error format.
- **Aggregate in SQL**, not PHP loops (volume `SUM(reps*weight_grams)`, PR via
  window functions, frequency via `date_trunc`).
- Pint clean; PHPUnit feature test per endpoint.

## AI layer

- LLM access behind an interface (`LlmClient`), provider chosen by container
  binding (Groq default, Gemini fallback). No provider SDK leaking into services.
- **Agents get read-only tools.** All persistence goes through the normal
  validated endpoints — an agent never writes directly to the DB.
- **Structured output is validated** against a Form Request / DTO exactly like
  user input; hallucinated exercises (no catalog ID) are rejected.
- Every AI flow is **rate-limited** and degrades gracefully when the provider is
  down (never blocks the core app).
- Parser/importer follow `PARSING.md`; ambiguity → `needs_review`, never a guess.
- A minimal **eval test** accompanies each agent (fixed input → asserted tools +
  valid structured output). No agent ships without one.

## Hard "do NOT" list (instant evaluator FAIL)

- Marking a step DONE with any red check or missing test.
- Editing files outside the step's declared scope.
- Weakening/altering a step's acceptance criteria to make it pass.
- Hand-writing generated API types, or storing weight as a float.
- Committing secrets (Neon URL, provider keys) — use env vars + `sync:false`.
- An agent path that writes to the DB directly or fabricates log data.
