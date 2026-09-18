# Calculator Monorepo

A web calculator built as a monorepo: a **React + Vite + TypeScript** single-page app talking
to a **Go** REST API, both running with **Docker Compose**.

All arithmetic happens in the backend ([ADR-002](docs/ARCHITECTURE.md#adr-002--all-calculation-logic-lives-in-the-backend));
the frontend sends the expression the user typed and renders what comes back. Supported
operations: **addition, subtraction, multiplication, division, exponentiation, square root and
percentage**, written as `+ - * / ^ √ %` with parentheses and decimals.

## Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19, Vite 8, TypeScript 6, pnpm · Tailwind 4, Mantine 9, TanStack Query 5 |
| Backend    | Go 1.27, standard library (`net/http`, `encoding/json`) + `expr-lang/expr` as the evaluator |
| Tests      | Go `testing` (table-driven) · Vitest + React Testing Library |
| Tooling    | ESLint · Prettier (frontend formatting) |
| Runtime    | Docker + Docker Compose (multi-stage: `dev` and `prod`) |
| Production | Distroless image for the Go binary · Nginx for the static build |

## Getting started

Requirements: Docker and Docker Compose. Nothing else — Go and Node run inside the containers.

```bash
git clone <repository-url>
cd calculator-monorepo
docker compose up --build
```

| Service  | URL                                     |
|----------|-----------------------------------------|
| Frontend | http://localhost:5173                   |
| Backend  | http://localhost:8080/api/v1            |
| Health   | http://localhost:8080/api/v1/health     |

Useful commands:

```bash
docker compose up --build        # start both services in development mode
docker compose restart backend   # reload the Go API after changing its source
docker compose logs -f backend   # follow the API logs
docker compose down -v           # stop everything and drop the volumes
```

The frontend hot-reloads on save. The Go service is rebuilt on restart
([ADR-008](docs/ARCHITECTURE.md#adr-008--docker-compose-as-the-only-way-to-run-the-project)).

### Configuration

| Variable            | Service  | Default                        |
|---------------------|----------|--------------------------------|
| `PORT`              | backend  | `8080`                         |
| `ALLOWED_ORIGIN`    | backend  | `http://localhost:5173`        |
| `VITE_API_BASE_URL` | frontend | `http://localhost:8080/api/v1` |
| `APP_HOST`          | compose  | `localhost`                    |

`APP_HOST` is the address the **browser** uses to reach this machine, and it drives the other
two together. It only matters when the browser is not on this machine — opening the app from a
phone, for instance:

```bash
APP_HOST=192.168.1.20 docker compose up --build
```

Leaving it unset keeps everything on `localhost`. Pointing only one of the two values at the
LAN address is not enough: the request would reach the API and then be blocked by CORS.

Both are set in `docker-compose.yml`; `frontend/.env.example` documents the frontend side.

## API example

A single endpoint takes the whole expression as a string
([ADR-011](docs/ARCHITECTURE.md#adr-011--a-free-form-expression-endpoint-evaluated-with-a-sandboxed-engine)):

```bash
curl -X POST http://localhost:8080/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{"expression":"2+3*√9"}'
```

```json
{
  "expression": "2+3*√9",
  "result": 11
}
```

Business errors answer with `422` and a typed code:

```bash
curl -X POST http://localhost:8080/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{"expression":"10/0"}'
```

```json
{
  "code": "DIVISION_BY_ZERO",
  "message": "cannot divide by zero"
}
```

Anything outside the operator catalogue is rejected with `400` before it reaches the
evaluator, so `{"expression":"abs(-2)"}` answers `INVALID_CHARACTERS`. The full contract —
operators, fields and error codes — is in [docs/API.md](docs/API.md).

## Deployment

The application deploys to **Vercel as a single project with two services**
([ADR-013](docs/ARCHITECTURE.md#adr-013--deployed-to-vercel-as-one-project-with-two-services)),
described in [`vercel.json`](vercel.json): `frontend/` with the Vite preset, `backend/` with the
Go preset, and two rewrites sending `/api/*` to the API and everything else to the app.

Importing the repository in Vercel is the whole setup — no build settings to fill in and no
environment variables to define:

- The Go preset finds `backend/go.mod` and `backend/cmd/api/main.go`, which already listens on
  `PORT`. The backend deploys **unchanged**.
- The service receives the original path, so `/api/v1/evaluate` arrives as `/api/v1/evaluate`
  and the routes registered in `main.go` keep working.
- Frontend and API share one origin, so `VITE_API_BASE_URL` falls back to the relative
  `/api/v1` and CORS plays no part in production. Preview deployments work without registering
  each generated URL.

`docker compose` remains how the project runs locally; Vercel does not replace it.

## Project layout

```
calculator-monorepo/
├── backend/              # Go API: model → controller → service
│   ├── cmd/api/          # composition root
│   └── internal/
│       ├── model/        # operator catalogue, allow-list, requests, responses, errors
│       ├── controller/   # HTTP adapter, error mapping, CORS
│       └── service/      # normalizer + expression evaluation
├── frontend/             # React SPA
│   └── src/
│       ├── components/   # common/ (reusable) and calculator/ (domain)
│       ├── hooks/        # reusable stateful logic
│       ├── services/     # the only place that calls fetch
│       ├── utils/        # regex, constants, pure functions
│       └── types/        # API contract types
├── docs/                 # ARCHITECTURE.md (ADRs) and API.md (contract)
├── docker-compose.yml
└── PROMPTS.md            # prompt log
```

## Architecture decisions

Every structural decision is recorded, with its rationale and consequences, in
**[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**:

| ADR | Decision |
|-----|----------|
| [ADR-001](docs/ARCHITECTURE.md#adr-001--monorepo-with-two-workspaces) | Monorepo with two independent workspaces |
| [ADR-002](docs/ARCHITECTURE.md#adr-002--all-calculation-logic-lives-in-the-backend) | All calculation logic in the backend |
| [ADR-003](docs/ARCHITECTURE.md#adr-003--simplified-three-layer-clean-architecture-in-the-backend) | Simplified three-layer clean architecture |
| [ADR-004](docs/ARCHITECTURE.md#adr-004--a-single-post-apiv1calculate-endpoint) | A single discrete-operation endpoint *(superseded by ADR-011)* |
| [ADR-005](docs/ARCHITECTURE.md#adr-005--go-standard-library-no-web-framework) | Go standard library, no web framework |
| [ADR-006](docs/ARCHITECTURE.md#adr-006--domain-errors-kept-separate-from-http-status-codes) | Domain errors decoupled from HTTP status codes |
| [ADR-007](docs/ARCHITECTURE.md#adr-007--frontend-organised-by-responsibility) | Frontend organised by responsibility |
| [ADR-008](docs/ARCHITECTURE.md#adr-008--docker-compose-as-the-only-way-to-run-the-project) | Docker Compose as the only way to run it |
| [ADR-009](docs/ARCHITECTURE.md#adr-009--cors-instead-of-a-dev-proxy) | CORS instead of a dev proxy |
| [ADR-010](docs/ARCHITECTURE.md#adr-010--unit-tests-and-coverage-are-part-of-the-definition-of-done) | Unit tests and coverage are part of done |
| [ADR-011](docs/ARCHITECTURE.md#adr-011--a-free-form-expression-endpoint-evaluated-with-a-sandboxed-engine) | Free-form expression endpoint with a sandboxed evaluator |
| [ADR-012](docs/ARCHITECTURE.md#adr-012--tailwind-mantine-and-tanstack-query-in-the-frontend) | Tailwind, Mantine and TanStack Query in the frontend |
| [ADR-013](docs/ARCHITECTURE.md#adr-013--deployed-to-vercel-as-one-project-with-two-services) | Deployed to Vercel as one project with two services |

Working rules — clean code principles (KISS, YAGNI, DRY), conventions and the definition of
done — live in `CLAUDE.md` at the root and in each workspace.

## Tests and coverage

Each end is delivered with its own unit tests
([ADR-010](docs/ARCHITECTURE.md#adr-010--unit-tests-and-coverage-are-part-of-the-definition-of-done)).
Minimum coverage: **80% per workspace**, **100% of the reachable branches** in the layers
holding the logic.

```bash
# Backend
docker compose exec backend go test ./...
docker compose exec backend go test -coverprofile=coverage.out ./...
docker compose exec backend go tool cover -func=coverage.out

# Frontend
docker compose exec frontend pnpm test --run
docker compose exec frontend pnpm test:coverage
docker compose exec frontend pnpm lint
docker compose exec frontend pnpm format:check
```

The frontend tests run inside the container on purpose: jsdom requires a Node version the host
may not have, and the image pins it.
