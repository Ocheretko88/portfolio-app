# 4. Deploy the front end and API on separate platforms

Date: 2026-07-17

## Status

Accepted

## Context

The project is two repositories: an Angular front end and a Laravel (PHP 8.3)
API. Both should run on free hosting. Vercel is an excellent, zero-config home
for the Angular build, but PHP is not a first-class Vercel runtime — running full
Laravel with a database there means a fragile community serverless shim.

## Decision

- **`portfolio-app` → Vercel.** Static/edge build, `dist/portfolio-app/browser`,
  SPA fallback rewrite. This is the always-on public URL.
- **`portfolio-api` → Render (free web service) + a persistent Neon PostgreSQL.**
  Render supports PHP via Docker; Neon's free Postgres persists (Render's own
  free database expires after 30 days).
- The front end is designed to present completely on its own. API-backed
  features load progressively, so a cold backend never blocks the CV.

## Consequences

- Each part runs on hosting suited to its runtime, both free.
- CORS and an environment-driven API base URL are required (tracked for the API
  integration work).
- Trade-off: Render's free tier cold-starts after ~15 minutes idle. Mitigated by
  graceful degradation now, and optionally a keep-warm ping later.
