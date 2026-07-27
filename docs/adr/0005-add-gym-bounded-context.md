# 5. Add GymTracker as a bounded context, not a new app

Date: 2026-07-24

## Status

Accepted

## Context

The portfolio is a data-driven CV site plus interactive full-stack demos. We are
adding a real, stateful feature — a gym-training tracker with a logging flow, a
trainer-authored program builder, a progress dashboard, and an agentic AI layer.
The question is whether this becomes a separate app/repository or grows the
existing `portfolio-app` / `portfolio-api`.

## Decision

Build it inside the existing system as a new **bounded context**:

- Frontend: a lazily-loaded Angular feature module `src/app/features/gym`, plus a
  `core/api/gym-api.ts` seam and a `gym.store` SignalStore.
- Backend: a domain slice `app/Domain/Gym` following the existing
  `Route → Controller → Service → Repository(interface) → data source` layering.
- Reuse the `ApiResponse` envelope, the OpenAPI-as-source-of-truth codegen, the
  `ThemeStore`, the command palette, and the bespoke design system.

No new repository, no second deployment pipeline.

## Consequences

- Reuse and consistency become a portfolio signal in themselves: one coherent,
  well-architected system growing a second domain without breaking its patterns.
- One CI/deploy path (Vercel + Render) continues to serve everything.
- The gym context must stay isolated behind its module/route and domain
  boundaries so the CV/demo code is never coupled to it.
- The same API is reusable by a future mobile client, matching the scale goal.
- Trade-off: the app carries more surface area; mitigated by the lazy route and
  the strict domain boundary.
