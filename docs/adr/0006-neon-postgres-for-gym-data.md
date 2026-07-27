# 6. Use Neon Postgres for GymTracker data

Date: 2026-07-24

## Status

Accepted

## Context

The existing CV/demo data is read-only and seeded from config, so SQLite on
Render's free tier is adequate for it. The training log is different: it is
written to on every workout. Render's free plan uses **ephemeral disk**, which
can be wiped on redeploy or restart — an unacceptable risk for a personal log the
athlete adds to daily.

## Decision

Use **Neon serverless Postgres** (free tier) as the store for gym data. Wire it
through a Laravel `pgsql` connection configured by a `DB_URL` environment
variable; the secret is never committed (marked `sync: false` in `render.yaml`).
Keep the CV/demo data on its current SQLite path for now — Laravel supports
multiple connections, so this is additive, not a migration of existing data.

## Consequences

- Training data is durable across redeploys.
- Real Postgres features (window functions for PR detection, `date_trunc` for
  frequency, JSONB for tags) power the dashboard aggregates in SQL rather than in
  PHP loops.
- One additional managed dependency, at $0 on the free tier.
- Clear future path: the CV/demo tables can move to Neon later for a single
  source of truth if desired (would warrant its own ADR).
- Migrations must run cleanly against an empty Neon database as part of setup.
