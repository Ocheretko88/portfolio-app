# Portfolio — Frontend (`portfolio-app`)

The Angular front end of my developer portfolio. A single-page, data-driven site
that presents my CV plus interactive demos that show how a full-stack request
actually flows through the machine.

**Stack:** Angular 21 · standalone components · Signals · NgRx SignalStore ·
PrimeNG · a hand-built design system · Vitest.

> Companion repository: [`portfolio-api`](../portfolio-api) — the Laravel 13 /
> PHP 8.5 backend that powers the live data and demos.

---

## Quick start

```bash
npm install
npm start            # dev server on http://localhost:4200
npm run build        # production build -> dist/portfolio-app/browser
npm test             # unit tests (Vitest)
npm run typecheck    # strict template + type check (ngc, no emit)
npm run api:types    # regenerate API types from the OpenAPI spec
```

Requires Node 22+.

---

## Architecture at a glance

```
src/app/
├─ core/
│  ├─ api/                   # typed API client layer + generated contract types
│  ├─ models/                # view models (Resume, ExperienceRole…)
│  ├─ data/                  # bundled CV snapshot (instant render + fallback)
│  ├─ services/              # ResumeService (signal + live fetch + fallback)
│  └─ state/                 # ThemeStore, CommandPaletteService
├─ layout/                   # header, footer, ⌘K command palette
└─ features/
   ├─ home/                  # landing page (composes the sections)
   ├─ sections/              # hero, profile, skills, experience, education, explore, contact
   ├─ xray/                  # X-Ray request visualiser (+ SignalStore)
   └─ security-lab/          # simulated SQL-injection / XSS lab (+ SignalStore)
```

Principles enforced in the code: data-driven UI, signals everywhere (`computed`,
`OnPush`, native control flow), one HTTP seam (`core/api/api-client.ts`) with a
service per domain (SRP), lazy feature routes, and accessibility as a
requirement (skip link, focus management, WCAG AA contrast). See `AGENTS.md`.

---

## API contract & codegen

The API's [`openapi.yaml`](src/app/core/api/openapi.yaml) is the single source of
truth; the TypeScript types in `src/app/core/api/generated/contract.ts` are
**generated** from it, so the client can't silently drift from the server.

When the contract changes: copy the updated spec from
`portfolio-api/docs/openapi.yaml` into `src/app/core/api/openapi.yaml`, run
`npm run api:types`, and fix any type errors that surface. Full details in the
API repo's `docs/CONTRACTS.md`.

---

## Roadmap

- [x] CV / resume site — data-driven, accessible, deployed (Vercel)
- [x] `GET /api/v1/resumes` served by the Laravel API, consumed with a fallback
- [x] Typed API client + OpenAPI-generated contract
- [x] **Under-the-hood X-Ray** — animates a real, server-timed request lifecycle
- [x] **Security Lab** — simulated XSS / SQL-injection: vulnerable vs. hardened
- [x] Command palette (⌘K) navigation

## License

[MIT](LICENSE) © Iryna Ocheretko
