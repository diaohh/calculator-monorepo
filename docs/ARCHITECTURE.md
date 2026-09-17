# Architecture Decision Records

Short record of the decisions that shape the application. Each one states its context, the
decision and its consequences. A new decision never edits an older one: it is appended and,
where relevant, marks the previous one as *Superseded*.

---

## ADR-001 — Monorepo with two workspaces
**Status:** Accepted

**Context.** Frontend and backend evolve together and share an API contract.

**Decision.** A single repository holding independent `frontend/` and `backend/` workspaces,
with no monorepo tooling (Nx, Turborepo) and no shared packages.

**Consequences.** A contract change happens in a single commit on both sides. Contract types
are deliberately duplicated (Go and TypeScript) because sharing them would require a code
generator that is not justified today (YAGNI).

---

## ADR-002 — All calculation logic lives in the backend
**Status:** Accepted

**Context.** The arithmetic could run in the browser, but the project defines a backend.

**Decision.** The frontend does not calculate. It sends the operation and its operands and
renders the response. Domain rules (division by zero, negative root) are resolved by the Go
service.

**Consequences.** One source of truth for every result (DRY). Each operation costs a network
round trip, which is acceptable at this scope. The frontend only validates input shape.

---

## ADR-003 — Simplified three-layer clean architecture in the backend
**Status:** Accepted

**Context.** Canonical clean architecture (entities, use cases, adapters, frameworks) adds
layers this domain does not need.

**Decision.** Three layers — `model` (data), `controller` (HTTP adapter), `service` (logic) —
with dependencies flowing one way: Controller → Service → Model.

**Consequences.** A readable, testable structure without ceremony. There is no repository
layer because there is no persistence (YAGNI); if history is added later it enters as a
fourth layer without touching the service.

---

## ADR-004 — A single `POST /api/v1/calculate` endpoint
**Status:** Accepted

**Context.** Seven operations could be seven endpoints.

**Decision.** One endpoint receiving `operation` as a body field.

**Consequences.** The frontend has a single HTTP client and the backend a single controller
(KISS, DRY). Adding an operation means adding a case in the service and a constant in the
model; routing and the frontend beyond the key list stay untouched.

---

## ADR-005 — Go standard library, no web framework
**Status:** Accepted

**Context.** Gin, Echo or Fiber are the usual choices.

**Decision.** `net/http` and `encoding/json` from the standard library.

**Consequences.** Zero external dependencies, faster builds, a smaller image and less surface
to maintain. In exchange, binding and CORS are written by hand — a handful of lines at this
scope.

---

## ADR-006 — Domain errors kept separate from HTTP status codes
**Status:** Accepted

**Context.** It is tempting to return the HTTP status straight from the service.

**Decision.** The service returns domain errors declared in `model`. The controller is the
only place that translates error → status, in a single file.

**Consequences.** The service can be tested and reused without HTTP. The status-code policy
lives in one place. Business errors → 422; shape errors → 400.

---

## ADR-007 — Frontend organised by responsibility
**Status:** Accepted

**Context.** The alternatives are grouping by feature or adopting atomic design.

**Decision.** Folders by responsibility: `services`, `components/common`,
`components/<domain>`, `hooks`, `utils`, `types`.

**Consequences.** It is obvious where each file goes in a single-screen app. Should several
screens appear, the project moves to feature-based grouping while keeping these internal
rules.

---

## ADR-008 — Docker Compose as the only way to run the project
**Status:** Accepted

**Context.** The project must run with Docker.

**Decision.** `docker compose up` starts both services. Multi-stage Dockerfiles expose a
`dev` stage (source bind-mounted: hot reload on the frontend, reload via
`docker compose restart backend` for Go) and a `prod` stage (Go binary on a minimal image;
static Vite build served by Nginx). Compose uses the `dev` stage by default.

**Consequences.** One command to start working, with neither Go nor Node installed on the
host. Production images come from the same Dockerfile, so the recipe is not duplicated (DRY).

---

## ADR-009 — CORS instead of a dev proxy
**Status:** Accepted

**Context.** The browser calls the backend from `localhost:5173` to `localhost:8080`.

**Decision.** The backend enables CORS for the frontend origin through `ALLOWED_ORIGIN`.
The frontend targets the backend through `VITE_API_BASE_URL`.

**Consequences.** Configuration is explicit and visible in `docker-compose.yml`. Deploying
both behind one domain is a matter of changing those two variables.

---

## ADR-010 — Unit tests and coverage are part of the definition of done
**Status:** Accepted

**Context.** Tests added "later" are tests never added, and the calculator's value is exactly
in its edge cases.

**Decision.** Each end ships its own unit tests with its implementation: Go's standard
`testing` package with table-driven tests in the backend, Vitest plus React Testing Library
in the frontend. Minimum coverage is 80% per workspace and 100% of branches where the logic
lives (`internal/service` in Go; `utils/` and `hooks/` in React).

**Consequences.** Every domain rule has a test pinning its error path. Coverage is measured
with the native tooling (`go tool cover`, `@vitest/coverage-v8`), so no extra infrastructure
is introduced. A layer without tests is not considered delivered.
