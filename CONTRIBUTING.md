# Contributing

This is a personal portfolio, but it is developed like a real project. If you are
reading this to evaluate how I work, this file is part of the answer.

## Workflow

1. Branch from `main` (`feat/…`, `fix/…`, `docs/…`, `chore/…`).
2. Keep changes focused; a change to behaviour comes with a test.
3. A non-trivial architectural choice gets an ADR in `docs/adr`.
4. Open a PR; CI must be green before merge.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <subject>
```

`type` is one of `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
Example: `feat(theme): persist light/dark choice across reloads`.

## Local checks (must pass)

```bash
npm run format:check   # Prettier
npm run typecheck      # strict template + type check (ngc, no emit)
npm run build          # production build
npm test               # unit tests (Vitest)
```

## Code standards

The rules the code is held to live in [`AGENTS.md`](AGENTS.md): standalone
components, signals for state, `OnPush`, native control flow, `inject()`,
`input()`/`output()`, and WCAG AA / AXE compliance. Please read it before your
first change.
