# Frontend — Calculator SPA

React + Vite + TypeScript single-page app for the calculator. It performs no arithmetic
([ADR-002](../docs/ARCHITECTURE.md#adr-002--all-calculation-logic-lives-in-the-backend)): it
captures the expression, sends it to `POST /api/v1/evaluate` and renders the result or the
error.

Working rules for this workspace live in [`CLAUDE.md`](CLAUDE.md); the HTTP contract is in
[`../docs/API.md`](../docs/API.md).

## Stack

| Piece | Job |
|-------|-----|
| React 19 + Vite 8 + TypeScript 6 | Application, dev server and build. The React Compiler is enabled, so manual memoization is not needed. |
| Tailwind 4 | Layout, spacing, typography and responsive rules. Palette declared as tokens in `src/index.css`. |
| Mantine 9 | Component chassis (`Paper`, `Button`, `Alert`, `Loader`) and the dark theme. |
| TanStack Query 5 | The evaluation request, its loading and error state, and its cache. |
| Vitest + React Testing Library | Unit and behaviour tests. |
| ESLint + Prettier | Linting and formatting. |

The rationale for the three UI dependencies is
[ADR-012](../docs/ARCHITECTURE.md#adr-012--tailwind-mantine-and-tanstack-query-in-the-frontend).

## Running it

The project runs with Docker Compose from the repository root
([ADR-008](../docs/ARCHITECTURE.md#adr-008--docker-compose-as-the-only-way-to-run-the-project)):

```bash
docker compose up --build     # http://localhost:5173
```

Commands inside the container:

```bash
docker compose exec frontend pnpm test --run       # tests, single run
docker compose exec frontend pnpm test:coverage    # coverage report with thresholds
docker compose exec frontend pnpm lint
docker compose exec frontend pnpm format           # or format:check
```

Tests run in the container because jsdom requires a Node version the host may not have, and the
image pins it. If dependencies change, the container's `node_modules` volume has to catch up:

```bash
docker compose exec -e CI=true frontend pnpm install --frozen-lockfile
```

## How it is put together

```
src/
├── components/
│   ├── common/        ErrorMessage
│   └── calculator/    Calculator, ExpressionDisplay, Keypad, CalculatorKey
├── hooks/             useCalculator, useEvaluation, useKeyboard
├── services/          http.ts (the only place calling fetch), calculator.service.ts
├── utils/             constants.ts, expression.ts, keyboard.ts, validation.ts, format.ts
├── types/             api.ts — mirrors docs/API.md
└── test/              setup and the provider wrapper used by the tests
```

Three things are worth knowing before changing it:

- **`CALCULATOR_KEYS` in `utils/constants.ts` is the single source of truth for the keypad.**
  The rendered grid and the physical keyboard bindings both derive from that list, so adding a
  key means adding one entry.
- **The evaluation is a query, not a mutation.** `useEvaluation` keys a `useQuery` by the
  expression, so evaluating the same expression twice is answered from the cache rather than
  from the network.
- **The CSS layer order in `src/index.css` is load-bearing.** Mantine sits above Tailwind's
  preflight and below its utilities; reordering those imports breaks the keypad's appearance.

## Environment variables

| Variable | Purpose | Value in Docker |
|----------|---------|-----------------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8080/api/v1` |

Declared in `.env.example`; the real `.env` is not versioned.
