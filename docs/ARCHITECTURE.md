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
**Status:** Superseded by ADR-011

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

---

## ADR-011 — A free-form expression endpoint evaluated with a sandboxed engine
**Status:** Accepted · Supersedes ADR-004

**Context.** A calculator display produces a whole expression, not a discrete operation with
one or two operands. Asking the frontend to split `2+3*√9` into calls would either move the
parsing and precedence rules into the browser — contradicting ADR-002 — or force a chain of
round trips.

**Decision.** `POST /api/v1/evaluate` takes the expression as a string and answers with the
result. Its design has four parts:

1. **An allow-list in the controller.** `model` owns the operator catalogue and a regular
   expression built from it; the controller rejects anything else with `400` before the
   service is reached. It rejects, it does not sanitise: no escaping, no stripping. Since no
   letter can ever pass, no identifier, builtin call or string literal can be injected into
   the evaluator, which closes the injection vector structurally rather than by filtering
   known-bad input. The length bound completes it: the grammar has no loops or variables, so
   bounding the input bounds the cost of an evaluation and no timeout is needed.
2. **`github.com/expr-lang/expr` as the engine.** It compiles to an AST, evaluates in a
   sandbox with no access to the host, and accepts custom functions. This relaxes ADR-005
   ("standard library only") for one dependency: writing and maintaining a correct parser with
   operator precedence is work the requirement does not ask for, and the alternative — a
   hand-written shunting-yard parser — would have been more code to own for the same result.
3. **A normalizer in the service.** The catalogue and the engine do not speak the same
   language, and translating between them is business logic: numbers are promoted to float
   literals so `1/2` is `0.5` and not `0`, `√x` becomes a call to a registered `sqrt`, and the
   postfix `x%` becomes `(x/100.0)` because `%` means modulo to the engine. `^` is passed
   through unchanged, since the engine already reads it as exponentiation.
4. **Domain errors instead of floating point artefacts.** Division is patched in the AST into
   a call that reports dividing by zero as a domain error, `sqrt` reports a negative radicand,
   and any remaining infinity or `NaN` becomes an explicit error. A panic inside the engine is
   recovered and answered as `500`.

**Consequences.** The frontend keeps no arithmetic: it sends what the user typed and renders
what comes back (ADR-002 holds). The contract has one endpoint and one input field, and adding
an operator means adding a symbol in `model` plus a rewrite rule in the normalizer. The price
is a third-party dependency in the evaluation path and the obligation to keep the allow-list
and the normalizer in agreement — which is why both are pinned by tests, including injection
attempts as explicit cases.

Two secondary decisions are recorded here: the percentage is **postfix** (`10%` is `0.1`, so
`200+10%` is `200.1` and not `220`), chosen because it composes predictably inside a free-form
expression; and results are **rounded to 10 decimals**, so `0.1+0.2` reads as `0.3` on the
display without hiding any precision a calculator can show.

---

## ADR-012 — Tailwind, Mantine and TanStack Query in the frontend
**Status:** Accepted · Relaxes ADR-007

**Context.** ADR-007 organised the frontend by responsibility and the workspace rules added two
constraints that made sense while there was no screen: styling through per-component CSS, and
no data-fetching library while a `useState` and a hook were enough. Building the calculator
screen made both worth revisiting. The screen is a dark, responsive keypad where spacing,
sizing and state variants repeat across twenty-three keys, and the evaluation is a network call
whose loading, error and caching behaviour has to be handled somewhere.

**Decision.** Three dependencies enter the frontend, each with a defined job:

1. **Tailwind** for layout, spacing, typography and the responsive rules, with the dark palette
   declared once as design tokens in `src/index.css`.
2. **Mantine** for the component chassis — `Paper`, `Button`, `Alert`, `Loader` — and for the
   dark theme, mounted through a `MantineProvider` with `forceColorScheme="dark"`. There is no
   theme switcher because nobody asked for one (YAGNI).
3. **TanStack Query** for the evaluation request. It is modelled as a **`useQuery` keyed by the
   expression**, not as a `useMutation`: evaluating is a pure read, the same expression always
   yields the same number, so `staleTime` and `gcTime` are infinite and asking twice is
   answered from the cache instead of from the network. `retry` is off, because a `422` is the
   domain answering and repeating the call cannot change it.

Two supporting decisions belong to the same change. **Prettier** owns formatting, so that
layout stops being a matter of opinion; the keypad catalogue in `utils/constants.ts` is the one
exception, kept hand-aligned behind `// prettier-ignore` because one key per line reads as the
grid it describes. And the **CSS layer order** is declared explicitly —
`theme, base, mantine, components, utilities` — which is what lets the two styling systems
coexist: Mantine sits above Tailwind's preflight, which would otherwise strip the components'
base styles, and below Tailwind's utilities, so a utility class always wins without a
specificity war.

**Consequences.** The frontend gains three dependencies and the bundle grows, which is the
price of not hand-writing a design system for a single screen. The workspace rules in
`frontend/CLAUDE.md` are rewritten to match, since two of them now describe the opposite of
what the code does. The layer order becomes a load-bearing detail: changing the order of those
imports breaks the keypad's appearance, which is why it carries a comment.

One thing deliberately did **not** follow: the frontend still does not validate the expression
beyond its length. The character allow-list is not duplicated from the backend because every
symbol originates in `CALCULATOR_KEYS` — clicks and physical keys both resolve through
`findKeyBinding` — so a symbol outside the catalogue cannot be produced, and copying the
regular expression would add a second source of truth to keep in step for no gain. Grammar
(`2+`, `(2+3`) remains the backend's call, as ADR-002 requires.

---

## ADR-013 — Deployed to Vercel as one project with two services
**Status:** Accepted · Relaxes ADR-009 in production

**Context.** The project had to be deployable, and opening it from a phone on the local network
already exposed the problem: the API base URL is baked into the bundle at build time and the
backend allows exactly one CORS origin, both pointing at `localhost`. Any deployment hits the
same wall, multiplied by Vercel's preview URLs, which change on every deploy.

The obvious reading — "Vercel hosts the frontend, the Go API goes somewhere else" — costs two
platforms and keeps CORS as a permanent source of breakage. The other obvious reading —
"rewrite the API as Vercel Go functions under `/api`" — looked cheap and is not: Go's `internal`
rule only allows `backend/internal/...` to be imported from within the `backend/` tree, so a
function at the repository root could not reuse the existing layers without either moving the
packages out of `internal` or flattening the two workspaces into one module. Both would damage
ADR-001 and ADR-003 to satisfy a hosting detail.

**Decision.** One Vercel project with two **services** declared in `vercel.json`: `frontend/`
built with the Vite preset, and `backend/` built with the Go framework preset. Public routing
is a pair of top-level rewrites — `/api/(.*)` to the backend, everything else to the frontend.

Three properties of this setup are what make it the right one:

1. **The backend deploys unchanged.** The Go preset looks for `go.mod` at the service root and
   an entrypoint at `cmd/api/main.go`, serving on the port given by `PORT` — which is precisely
   what ADR-003 and ADR-008 already produced. No new entrypoint, no `internal` problem, no
   second copy of the wiring.
2. **The route the service sees is the original one.** A request for `/api/v1/evaluate` reaches
   the Go server as `/api/v1/evaluate`, not `/v1/evaluate`, so the routes registered in
   `cmd/api/main.go` keep working as written.
3. **Frontend and API share one origin.** The browser calls `/api/v1/evaluate` on the same host
   that served the page, so the request is not cross-origin at all: no preflight, no allow-list,
   and preview deployments work without registering each generated URL. `VITE_API_BASE_URL`
   therefore defaults to the relative `/api/v1` and only needs a value when the two ends run on
   different origins.

**Consequences.** Deploying is importing the repository and pushing; the whole application lives
behind one domain with one firewall and one set of deployment protections. ADR-009 still governs
local development, where the two ends genuinely sit on different ports and CORS is still what
makes the browser accept the response — `ALLOWED_ORIGIN` remains, and it is simply unused in
production. `docker-compose.yml` stays the way the project runs locally (ADR-008); Vercel does
not replace it.

The cost is a platform-specific file in the repository and a dependency on Vercel's services
model, which is what buys the single origin. Should the project move elsewhere, the fallback is
the boring one — frontend on any static host, backend from the `prod` stage of its existing
Dockerfile — at the price of bringing CORS back into the deployed setup.
