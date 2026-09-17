# Calculator Monorepo

A web calculator built as a monorepo: a **React + Vite + TypeScript** single-page app talking
to a **Go** REST API, both running with **Docker Compose**.

All arithmetic happens in the backend ([ADR-002](docs/ARCHITECTURE.md#adr-002--all-calculation-logic-lives-in-the-backend));
the frontend captures the input, validates its shape and renders the result. Supported
operations: **addition, subtraction, multiplication, division, exponentiation, square root and
percentage**.

## Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19, Vite 8, TypeScript 6, pnpm |
| Backend    | Go 1.27, standard library only (`net/http`, `encoding/json`) |
| Tests      | Go `testing` (table-driven) · Vitest + React Testing Library |
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

Both are set in `docker-compose.yml`; `frontend/.env.example` documents the frontend side.

## API example

A single endpoint carries every operation
([ADR-004](docs/ARCHITECTURE.md#adr-004--a-single-post-apiv1calculate-endpoint)):

```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"divide","operandA":10,"operandB":4}'
```

```json
{
  "operation": "divide",
  "operandA": 10,
  "operandB": 4,
  "result": 2.5
}
```

Business errors answer with `422` and a typed code:

```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"divide","operandA":10,"operandB":0}'
```

```json
{
  "code": "DIVISION_BY_ZERO",
  "message": "cannot divide by zero"
}
```

Square root takes a single operand (`operandB` is omitted). The full contract — operations,
fields and error codes — is in [docs/API.md](docs/API.md).

## Project layout

```
calculator-monorepo/
├── backend/              # Go API: model → controller → service
│   ├── cmd/api/          # composition root
│   └── internal/
│       ├── model/        # requests, responses, domain errors
│       ├── controller/   # HTTP adapter and error mapping
│       └── service/      # calculation logic
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
| [ADR-004](docs/ARCHITECTURE.md#adr-004--a-single-post-apiv1calculate-endpoint) | A single `POST /calculate` endpoint |
| [ADR-005](docs/ARCHITECTURE.md#adr-005--go-standard-library-no-web-framework) | Go standard library, no web framework |
| [ADR-006](docs/ARCHITECTURE.md#adr-006--domain-errors-kept-separate-from-http-status-codes) | Domain errors decoupled from HTTP status codes |
| [ADR-007](docs/ARCHITECTURE.md#adr-007--frontend-organised-by-responsibility) | Frontend organised by responsibility |
| [ADR-008](docs/ARCHITECTURE.md#adr-008--docker-compose-as-the-only-way-to-run-the-project) | Docker Compose as the only way to run it |
| [ADR-009](docs/ARCHITECTURE.md#adr-009--cors-instead-of-a-dev-proxy) | CORS instead of a dev proxy |
| [ADR-010](docs/ARCHITECTURE.md#adr-010--unit-tests-and-coverage-are-part-of-the-definition-of-done) | Unit tests and coverage are part of done |

Working rules — clean code principles (KISS, YAGNI, DRY), conventions and the definition of
done — live in `CLAUDE.md` at the root and in each workspace.

## Tests and coverage

Each end is delivered with its own unit tests
([ADR-010](docs/ARCHITECTURE.md#adr-010--unit-tests-and-coverage-are-part-of-the-definition-of-done)).
Minimum coverage: **80% per workspace**, **100% of branches** in the layers holding logic.

```bash
# Backend
docker compose exec backend go test ./...
docker compose exec backend go test -coverprofile=coverage.out ./...
docker compose exec backend go tool cover -func=coverage.out

# Frontend
docker compose exec frontend pnpm test --run
docker compose exec frontend pnpm test:coverage
```
