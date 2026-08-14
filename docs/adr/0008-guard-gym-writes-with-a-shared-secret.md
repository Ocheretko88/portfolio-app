# 8. Guard gym writes with a shared secret; keep sequential bigint IDs

Date: 2026-08-14

## Status

Accepted

## Context

Two related exposure questions were left implicit by the Phase-1 slice and
surfaced by the 2026-07-28 audit.

**Writes are anonymous.** `POST /api/v1/gym/sessions` is reachable by anyone who
finds the URL, under the default `throttle:api` only. Spec §9 knowingly accepts
*read* obscurity for a single-athlete MVP — the training log is not a secret and
a full auth stack would be disproportionate. It never accepted anonymous
**writes**: an open write endpoint lets a stranger inject sessions, which
corrupts the very data the PR detection and stats are computed from, and it is
the first thing a reviewer flags on sight.

**IDs are enumerable.** The spec (§3) called for UUID primary keys; the
migrations landed sequential bigints. Nothing currently exposes a session ID to
an untrusted party, but the divergence was undocumented drift rather than a
decision, and Phase 3's share links will hand IDs to people outside the athlete's
control.

## Decision

- Mutating `/gym` routes require an `X-Gym-Token` request header matching
  `config('gym.write_token')` (env `GYM_WRITE_TOKEN`, `sync: false` on Render).
  Reads stay open. The check lives in a thin `EnsureGymWriteToken` middleware,
  compares with `hash_equals`, and **fails closed** — an unconfigured secret
  refuses writes rather than allowing them.
- Failures reuse the existing error envelope as `401` /
  `AuthenticationException`; nothing new is invented for this path.
- Mutating routes additionally get their own `throttle:gym-write` limiter
  (10/min per IP), well below the read limit, so the secret cannot be
  brute-forced at API speed.
- The middleware is deliberately shaped like the planned Phase-3
  `ResolveShareLink` guard, so that work slots in beside this one rather than
  replacing it.
- **Keep sequential bigint IDs.** They are not the security boundary; the
  unguessable value is `share_links.token`, which is already indexed and
  random. Migrating ten tables to UUIDs buys nothing while writes are guarded
  and reads are intentionally public.

## Consequences

- The Angular client must send `X-Gym-Token` on writes; the value is a build-time
  environment variable, which means it is **visible to anyone who opens the
  bundle**. This guard raises the bar from "anyone with the URL" to "anyone who
  reads the deployed JS" — it is anti-drive-by, not authentication. Real auth is
  the Phase-3/4 conversation, and this middleware is the seam it replaces.
- One more secret to set in three places (local `.env`, Render, CI). Forgetting
  it breaks writes loudly (401) rather than silently, which is the intended
  failure mode.
- Rotating the secret invalidates any client build that embedded the old one.
- Because IDs stay sequential, Phase 3 must not put a raw session ID in a shared
  URL; share links address content through their own token. Revisit this ADR if
  that constraint ever becomes inconvenient.
- The spec's §3 "UUID" wording is superseded by this ADR.
