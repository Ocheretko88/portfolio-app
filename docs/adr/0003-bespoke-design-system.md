# 3. Build a bespoke token design system rather than theme PrimeNG

Date: 2026-07-17

## Status

Accepted

## Context

PrimeNG is a dependency and will be used for richer interactive widgets (tables,
overlays, the future demos). But the visual identity — a "complex" orange / red /
blue / black palette that reads as deliberate rather than a default template — is
central to the portfolio's first impression.

## Decision

Own the visual language as a small set of CSS custom properties in
`src/styles.css`, with each colour assigned a semantic role (canvas, brand,
system, danger) and light/dark variants flipped by a `data-theme` attribute.
PrimeNG components are introduced where they earn their keep and themed to sit
inside these tokens, not the other way round.

## Consequences

- The look is distinctive and controlled down to the token; nothing reads as
  "stock theme".
- Colours carry meaning that later features reuse (blue = data in flight,
  red = an exploit fired), so the palette stays coherent as the site grows.
- Trade-off: we hand-write component styling instead of inheriting a full theme.
  Worth it for a portfolio whose surface area is small and whose appearance is
  part of the message.
