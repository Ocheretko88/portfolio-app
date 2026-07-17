# Portfolio — Frontend (`portfolio-app`)

The Angular front end of my developer portfolio. A single-page, data-driven site
that presents my CV and, incrementally, a set of interactive demos that show how
a full-stack request actually flows through the machine.

**Stack:** Angular 21 · standalone components · Signals · NgRx SignalStore ·
PrimeNG · a hand-built design system · Vitest.

> Companion repository: [`portfolio-api`](../portfolio-api) — the Laravel 13 / PHP 8.3
> backend (Sanctum auth, PostgreSQL) that will power the live demos.

---

## Quick start

```bash
npm install
npm start            # dev server on http://localhost:4200
npm run build        # production build -> dist/portfolio-app/browser
npm test             # unit tests (Vitest)
```

Requires Node 22+.

---

## Architecture at a glance

The app is deliberately small but structured the way a larger application would
be, so the conventions scale.

```
src/app/
├─ core/                     # cross-cutting, no UI
│  ├─ models/                # typed domain contracts (Resume, ExperienceRole…)
│  ├─ data/                  # single source of truth for CV content
│  ├─ services/              # ResumeService — exposes content as signals
│  └─ state/                 # ThemeStore — NgRx SignalStore
├─ layout/                   # site chrome (header, footer)
└─ features/
   ├─ home/                  # the landing page, composes the sections
   └─ sections/              # hero, profile, skills, experience, education, contact
```

Guiding principles, each enforced in the code:

- **Data-driven UI.** Every section renders from typed structures in
  `core/data`, never from hard-coded markup. Swapping the static constant for an
  HTTP call to `GET /api/v1/resume` later touches one service, not the templates.
- **Signals everywhere.** State is signals; derived values are `computed`;
  components are `OnPush`. No `NgModule`s, no `*ngIf`/`*ngFor` — native control
  flow (`@if`, `@for`) only.
- **Standalone + lazy.** The landing page is a lazily-loaded route, keeping the
  pattern ready for the game / security-lab routes to come.
- **Accessibility is a requirement, not a polish pass.** Semantic landmarks, a
  skip link, visible focus rings, `prefers-reduced-motion` support, and a colour
  system checked for WCAG AA contrast. See `AGENTS.md` for the full ruleset the
  code is held to.

A fuller write-up, including the request-lifecycle diagram, lives in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Notable decisions and their
trade-offs are recorded as ADRs in [`docs/adr/`](docs/adr).

---

## Design system

Rather than shipping a stock theme, the palette is a bespoke token system where
each colour has a semantic job:

| Colour            | Role      | Meaning                                  |
| ----------------- | --------- | ---------------------------------------- |
| Blue-black ink    | canvas    | backgrounds — never pure black           |
| Burnt sienna / amber | brand   | me; primary actions and highlights       |
| Slate / electric blue | system | the stack; focus states and data flow    |
| Oxblood / signal red | danger  | reserved for the security demos          |

Tokens are CSS custom properties in `src/styles.css`, flipped between light and
dark by a `data-theme` attribute the `ThemeStore` writes to `<html>`.

---

## Verification

Local checks that gate every change:

```bash
npm run build                          # AOT build + bundle
npx ngc -p tsconfig.app.json --noEmit  # strict template type-check
npm test                               # unit tests
npx prettier --check "src/**/*"        # formatting
```

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the same checks
on every push and pull request.

---

## Roadmap

- [x] CV / resume site — data-driven, accessible, deployed
- [ ] `GET /api/v1/resume` served by the Laravel API
- [ ] **Under-the-hood X-Ray** — animate a real request through the full
      Angular → Laravel → PostgreSQL pipeline
- [ ] **Security lab** — a sandboxed XSS / SQL-injection demo paired with its
      hardened counterpart
- [ ] Command palette (⌘K) navigation

## License

[MIT](LICENSE) © Iryna Ocheretko
