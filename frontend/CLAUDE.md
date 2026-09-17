# Frontend — Context (React + Vite + TypeScript)

SPA consuming the backend API. It implements no calculation logic: it sends the operation and
its operands and renders the result or the error. Package manager: **pnpm**.
Everything — code, comments, tests — is written in English.

## Modular structure

```
frontend/src/
├── components/
│   ├── common/        # reusable, domain-agnostic (Button, Display, Alert)
│   └── calculator/    # domain components (Calculator, Keypad, OperationPad)
├── hooks/             # reusable React logic (useCalculator, useApiRequest)
├── services/          # HTTP access to the backend (calculator.service.ts, http.ts)
├── utils/             # regex, constants and pure functions (validation.ts, constants.ts, format.ts)
├── types/             # shared types mirroring the API contract
├── App.tsx
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
- **Pure** functions, no state and no React: validation, formatting, regex and constants.
- `constants.ts` holds the operation keys and their visible labels.
- `validation.ts` holds the regular expressions (numeric input, sign, decimals).
- If a function needs `useState` or `useEffect`, it belongs in `hooks/`, not here.

## Conventions

- Strict TypeScript: **no `any`**. Contract types live in `types/` and mirror `docs/API.md`
  exactly.
- Function components with typed props (`type XxxProps`); no `React.FC`.
- File names: components and hooks as `PascalCase.tsx` / `camelCase.ts`; everything else
  `camelCase.ts`.
- Local state first. No global state or data-fetching libraries while a `useState` and a
  hook are enough.
- Styling: per-component CSS next to the component; CSS variables for colours and spacing.
- Baseline accessibility: real `<button>` elements, `aria-label` on operation keys, visible
  focus, and the display announced with `aria-live`.
- Every backend error is surfaced to the user; never an empty `catch`.
- No logic inside JSX: complex conditions are computed before the `return`.
- `pnpm lint` must pass with no warnings before a change is considered done.

## How the principles apply

- **KISS**: one hook (`useCalculator`) owning display, operands and operation, instead of a
  reducer-based state machine.
- **YAGNI**: no router, no configurable theming, no i18n, no history or memory keys (M+, MR)
  until they are requested.
- **DRY**: operation keys, labels and error messages are declared once in `utils/constants.ts`
  and `types/`; the keypad is rendered from that list.

## Testing and coverage

Unit tests ship with the code; a module is not done until it is tested.
Tooling: **Vitest** + **React Testing Library** (`@testing-library/react`,
`@testing-library/user-event`, `jsdom`, `@vitest/coverage-v8`).

- `utils/` — pure function tests: regex validation, formatting, edge cases (empty string,
  lone sign, multiple dots).
- `hooks/` — `renderHook` tests for `useCalculator`: operand entry, operation selection,
  loading state, error propagation. The service is mocked at the module boundary.
- `services/` — `fetch` stubbed: request payload, success parsing, and mapping of 400 / 422 /
  500 responses into typed errors.
- `components/` — behaviour tests: the user clicks keys and the display shows the expected
  value; the backend error is rendered. Query by role and accessible name, never by CSS class.

```bash
pnpm test              # watch mode
pnpm test --run        # single run (CI)
pnpm test:coverage     # v8 coverage report
```

Targets: **≥ 80% overall**, **100% of branches in `utils/` and `hooks/`**.
`src/main.tsx` and type-only files are excluded from the coverage report.

## Environment variables

| Variable            | Purpose               | Value in Docker                |
|---------------------|-----------------------|--------------------------------|
| `VITE_API_BASE_URL` | Backend API base URL  | `http://localhost:8080/api/v1` |

Declared in `.env.example`; the real `.env` is not versioned.
