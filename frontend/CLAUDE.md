# Frontend — Context (React + Vite + TypeScript)

SPA consuming the backend API. It implements no calculation logic: it sends the expression the
user wrote and renders the result or the error. Package manager: **pnpm**.
Everything — code, comments, tests — is written in English.

Stack, and what each piece is responsible for
([ADR-012](../docs/ARCHITECTURE.md#adr-012--tailwind-mantine-and-tanstack-query-in-the-frontend)):

| Piece | Job |
|-------|-----|
| **Tailwind** | Layout, spacing, typography, responsive rules. Palette declared once as tokens in `src/index.css`. |
| **Mantine** | Component chassis (`Paper`, `Button`, `Alert`, `Loader`) and the dark theme. |
| **TanStack Query** | The evaluation request, its loading and error state, and its cache. |
| **Prettier** | Formatting. It is not a matter of opinion; run `pnpm format`. |

## Modular structure

```
frontend/src/
├── components/
│   ├── common/        # reusable, domain-agnostic (ErrorMessage)
│   └── calculator/    # domain components (Calculator, Keypad, CalculatorKey, ExpressionDisplay)
├── hooks/             # reusable React logic (useCalculator, useEvaluation, useKeyboard)
├── services/          # HTTP access to the backend (calculator.service.ts, http.ts)
├── utils/             # constants and pure functions (constants.ts, expression.ts, keyboard.ts,
│                      #   validation.ts, format.ts)
├── types/             # shared types mirroring the API contract
├── test/              # test harness (setup, provider wrapper) — not application code
├── App.tsx            # providers (Mantine, TanStack Query) and the page layout
└── main.tsx
```

### Rules per folder

**`services/`**
- The only place where `fetch` is called. No component or hook calls `fetch` directly.
- `http.ts` centralises base URL, headers, JSON parsing and the translation of an HTTP
  failure into a typed application error.
- One service per resource; functions named after intent (`calculate`), not after the HTTP verb.
- The base URL comes from `import.meta.env.VITE_API_BASE_URL`; never a hard-coded URL.

**`components/common/`**
- Reusable, unaware of the calculator domain, never calling services.
- Everything in through props, everything out through callbacks.

**`components/<domain>/`**
- Compose the common components and consume hooks. Presentation and composition, not
  business logic.
- One component per file, named exactly like the file (`PascalCase.tsx`).

**`hooks/`**
- Encapsulate reusable state and effects. `use` prefix, one hook per file.
- They are the bridge between components and `services/`: the component uses the hook,
  the hook uses the service.
- Expose explicit state (`data`, `error`, `isLoading`) instead of scattered flags.

**`utils/`**
- **Pure** functions, no state and no React: validation, formatting and constants.
- `constants.ts` holds `CALCULATOR_KEYS` — the single source of truth for the keypad — and the
  error-code messages. Both the rendered grid and the physical keyboard bindings derive from
  that list, so a key is never declared twice.
- `validation.ts` holds the input bounds that mirror the contract. It deliberately does **not**
  duplicate the backend allow-list: every symbol comes from `CALCULATOR_KEYS`, so one outside
  the catalogue cannot be produced.
- If a function needs `useState` or `useEffect`, it belongs in `hooks/`, not here.

## Conventions

- Strict TypeScript: **no `any`**. Contract types live in `types/` and mirror `docs/API.md`
  exactly.
- Function components with typed props (`type XxxProps`); no `React.FC`.
- File names: components and hooks as `PascalCase.tsx` / `camelCase.ts`; everything else
  `camelCase.ts`.
- Local state first: `useState` inside a hook. Server state belongs to TanStack Query; there is
  no global client state store, and none is needed at this scope.
- **Effects are for connecting to the outside world, nothing else.** Derived state is derived,
  never synchronised in a `useEffect`. The only effect in the app is `useKeyboard`, which
  subscribes to `keydown` on `window`.
- **No manual memoization by default.** The React Compiler is enabled in `vite.config.ts`;
  reach for `useMemo`/`useCallback` only with a measured reason.
- Styling: Tailwind utilities, with the palette as tokens in `src/index.css`. The CSS layer
  order declared there (`theme, base, mantine, components, utilities`) is load-bearing — it is
  what keeps Tailwind's preflight from stripping Mantine's component styles.
- Baseline accessibility: real `<button>` elements, `aria-label` on every key, visible focus,
  and the result announced with `aria-live`.
- Every backend error is surfaced to the user; never an empty `catch`. Error codes become
  readable text in exactly one place, `ERROR_MESSAGES`.
- No logic inside JSX: complex conditions are computed before the `return`.
- `pnpm lint` and `pnpm format:check` must pass before a change is considered done.

## How the principles apply

- **KISS**: one hook (`useCalculator`) owning the expression and what was submitted, instead of
  a reducer-based state machine. Clicks and physical keys resolve to the same handler.
- **YAGNI**: no router, no theme switcher, no i18n, no history or memory keys (M+, MR) until
  they are requested.
- **DRY**: the keypad, the keyboard bindings and the error messages come from
  `utils/constants.ts`; the contract types from `types/`. The backend allow-list is not copied
  here, because that would be a second source of truth for the same rule.

## Testing and coverage

Unit tests ship with the code; a module is not done until it is tested.
Tooling: **Vitest** + **React Testing Library** (`@testing-library/react`,
`@testing-library/user-event`, `jsdom`, `@vitest/coverage-v8`).

- `utils/` — pure function tests: length bound, key bindings, result formatting, edge cases
  (empty string, unknown key, modifier keys).
- `hooks/` — `renderHook` tests: expression entry and deletion for `useCalculator`; success,
  domain error and **cache reuse** for `useEvaluation`. The service is mocked at the module
  boundary.
- `services/` — `fetch` stubbed: request payload, success parsing, and mapping of 400 / 422 /
  500 and network failures into `ApiRequestError`.
- `components/` — behaviour tests: the user presses keys and the display shows the expected
  value; the backend error is rendered. Query by role and accessible name, never by CSS class.
  `src/test/renderWithProviders.tsx` supplies a fresh `QueryClient` per test, so a cached
  result never leaks into the next one.

```bash
pnpm test              # watch mode
pnpm test --run        # single run (CI)
pnpm test:coverage     # v8 coverage report, thresholds enforced
```

Targets: **≥ 80% overall**, **100% of branches in `utils/` and `hooks/`**.
`src/main.tsx`, `src/types/` and `src/test/` are excluded from the coverage report.

Tests run inside the container (`docker compose exec frontend pnpm test --run`): jsdom requires
a Node version the host may not have, and the image pins it.

## Environment variables

| Variable            | Purpose               | Value in Docker                |
|---------------------|-----------------------|--------------------------------|
| `VITE_API_BASE_URL` | Backend API base URL  | `http://localhost:8080/api/v1` |

Declared in `.env.example`; the real `.env` is not versioned.
