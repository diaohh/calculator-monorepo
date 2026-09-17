# Calculator Monorepo — Project Context

Web calculator application. Monorepo with a frontend (React + Vite + TypeScript) and a
backend (Go). All calculation logic lives in the backend; the frontend only captures input,
validates its shape and renders the result.

**Language rule: everything is written in English** — code, comments, documentation, commit
messages, tests and this context. No exceptions.

## Repository layout

```
calculator-monorepo/
├── backend/          # Go REST API (simplified clean architecture)
├── frontend/         # React + Vite SPA (modular structure)
├── docs/             # Architecture decisions and API contract
├── docker-compose.yml
├── PROMPTS.md        # Prompt log
└── CLAUDE.md         # This file
```

Each workspace has its own `CLAUDE.md` with its specific rules:
- `backend/CLAUDE.md`
- `frontend/CLAUDE.md`

Supporting documentation:
- `docs/ARCHITECTURE.md` — architecture decision records (ADRs) and their rationale.
- `docs/API.md` — HTTP contract between frontend and backend.

## Supported operations

| Operation      | `operation` | Operands                  |
|----------------|-------------|---------------------------|
| Addition       | `add`       | a, b                      |
| Subtraction    | `subtract`  | a, b                      |
| Multiplication | `multiply`  | a, b                      |
| Division       | `divide`    | a, b (b ≠ 0)              |
| Exponentiation | `power`     | a (base), b (exponent)    |
| Square root    | `sqrt`      | a (a ≥ 0)                 |
| Percentage     | `percent`   | a (value), b (percentage) |

Domain rules: `divide` with b = 0 and `sqrt` with a < 0 are business errors (HTTP 422),
never panics and never `NaN`.

## Clean code principles

These three principles outrank any stylistic preference. If a decision contradicts them,
the decision is wrong.

### KISS — Keep It Simple, Stupid
- The simplest solution that satisfies the requirement is the correct one.
- No layers, wrappers or abstractions that merely forward calls.
- Short functions, one level of abstraction per function, explicit names.
- If explaining a piece takes more than two sentences, simplify it.

### YAGNI — You Aren't Gonna Need It
- Only implement what the current requirement asks for. Nothing "just in case".
- Forbidden while out of scope: database, authentication, cache, queues, i18n, persisted
  history, feature flags, multi-tenancy.
- No single-implementation interfaces unless there is a real need (here: the calculator
  service, for testability and to keep the layer boundary).
- No configuration knobs nobody configures.

### DRY — Don't Repeat Yourself
- One source of truth per concept: operation keys, error messages and validations are
  declared in exactly one place per workspace.
- Extract on the third real repetition, not on the first resemblance.
- DRY applies to knowledge, not to text: two similar blocks that change for different
  reasons stay separate.

## Cross-cutting practices

- **Contract first**: any API change updates `docs/API.md` and both sides' types in the
  same commit.
- **Explicit errors**: never swallow an error; translate it into a response with a clear
  code and message.
- **No magic numbers or strings**: named constants.
- **English everywhere**: identifiers, routes, JSON fields, comments, docs and commits.
- **Comments explain why**, not what. The code says what.
- **No new dependencies without justification**: the standard library and what is already
  installed win by default.
- **Small commits**, one logical change each.

## Testing and coverage (mandatory)

Every feature is delivered **with its unit tests**. A layer is not done until it is tested.

| Workspace | Tooling                              | Commands |
|-----------|--------------------------------------|----------|
| Backend   | `testing` (stdlib), table-driven     | `go test ./...` · `go test -coverprofile=coverage.out ./...` |
| Frontend  | Vitest + React Testing Library       | `pnpm test` · `pnpm test:coverage` |

Rules:
- Minimum coverage **80% per workspace**; the backend service layer and the frontend
  `utils/` and `hooks/` are held to **100% of branches**, since that is where the logic is.
- Every domain rule has a test proving its error path (division by zero, negative root).
- Tests live next to the code they exercise (`*_test.go`, `*.test.ts(x)`).
- A test asserts behaviour, not implementation details.
- No mocks where a real value works; the calculator service is pure and needs none.

## Running the project

Everything runs with Docker Compose from the repository root:

```bash
docker compose up --build      # development mode
docker compose down
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:8080

## Prompt log

`PROMPTS.md` stores, in chronological order and in English, every prompt received from the
user. Each new prompt is appended as a new entry; previous entries are never edited.
