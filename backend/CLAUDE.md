# Backend — Context (Go)

Go 1.27 REST API built on the standard library (`net/http` + `encoding/json`) plus
`github.com/expr-lang/expr` as the expression evaluator. Module: `backend`. It evaluates the
mathematical expression the frontend sends. No database: the evaluation is pure and stateless.
Everything — code, comments, tests — is written in English.

## Simplified clean architecture (3 layers)

Dependencies flow in one direction only: **Controller → Service → Model**.
No inner layer knows about an outer one.

```
backend/
├── cmd/api/main.go              # composition root: config, wiring, routes, server start-up
└── internal/
    ├── model/                   # data structures: requests, responses, domain errors
    │   ├── expression.go        # operator catalogue, allow-list pattern, request/response
    │   └── errors.go            # domain errors (ErrDivisionByZero, ErrNegativeRoot, ...)
    ├── controller/              # HTTP adapter
    │   ├── evaluator.go         # the Evaluator handler
    │   ├── response.go          # JSON writing and the error → status mapping
    │   └── middleware.go        # CORS for the frontend origin
    └── service/                 # business logic
        ├── evaluator.go         # the Evaluator interface
        ├── expr_evaluator.go    # its implementation: compile, evaluate, translate failures
        └── normalizer.go        # operator catalogue → evaluator source language
```

File and type names carry no redundancy with their package: the type is `controller.Evaluator`,
not `controller.EvaluatorController`, and the implementation file is named after what it is
(`expr_evaluator.go`, the evaluator backed by expr) rather than after a generic `_impl` suffix.
Each package holds a single test file named after the unit it exercises.

### Model layer (`internal/model`)
- Data types only: request, response, the operator catalogue and the domain errors.
- **Zero dependencies**: it must not import `net/http`, `controller` or `service`.
- `json` tags on every exposed field.
- The **operator catalogue and the allow-list pattern live here and nowhere else**. The
  controller validates with them and the service normalizes with them, so adding a symbol is
  a change in one file.
- May hold intrinsic validation of the data (`EvaluateRequest.Validate`), never orchestration.

### Controller layer (`internal/controller`)
- The only layer that knows about HTTP. Its job is to **translate**, not to decide:
  1. Decode the body (bounded size, unknown fields rejected).
  2. Validate shape with the model allow-list — **before** the service is reached.
  3. Call the service.
  4. Map the result or the domain error to a status code and a JSON body.
- **No arithmetic and no parsing here.**
- Error mapping is centralised in `response.go`:
  - Bad body, empty, too long or forbidden characters → `400 Bad Request`
  - Malformed expression, division by zero, negative root, non-finite result →
    `422 Unprocessable Entity`
  - Unexpected → `500 Internal Server Error`, logged and never described to the client.

### Service layer (`internal/service`)
- Holds the business logic: the mapping from the operator catalogue to the evaluator's
  language (`normalizer.go`) and the evaluation itself.
- An `Evaluator` interface plus its implementation; the controller depends on the interface,
  not the struct (constructor injection from `main.go`).
- **Knows nothing about HTTP**: no `*http.Request`, no `http.ResponseWriter`.
- Returns the domain errors declared in `model`, never HTTP-flavoured errors.
- Pure and deterministic: same input, same output, no shared state.

## Expression handling

The evaluator does not speak the operator catalogue, so the service rewrites the expression
before compiling it:

| Input | Normalized | Why |
|-------|------------|-----|
| `2`   | `2.0`      | Forces float arithmetic, so `1/2` is `0.5` and never `0` |
| `√x`  | `sqrt(x)`  | The evaluator has no built-in square root; it is registered as a custom function |
| `x%`  | `(x/100.0)`| `%` means modulo to the evaluator; the catalogue defines it as a postfix percentage |
| `a/b` | `div(a,b)` | Patched in the AST so dividing by zero is a domain error, not a silent infinity |

`^` is passed through: the evaluator already treats it as exponentiation.

Two invariants hold the security of this layer:
- Nothing outside the catalogue reaches the evaluator, so no identifier, builtin call or
  string literal can be injected.
- A panic inside the evaluator is recovered and returned as a `500`, never as a crash.

## Go conventions

- `gofmt` is mandatory (`go fmt ./...`). `go vet ./...` must report nothing.
- Lowercase, singular package names; no generic `utils` or `helpers` packages.
- `NewXxx(deps...)` constructors returning the concrete type or the declared interface.
- Errors: `errors.New` / `fmt.Errorf` with `%w` for wrapping; compare with `errors.Is`.
  Domain errors are exported `Err...` variables in `model`.
- No mutable globals and no logic inside `init()`.
- `internal/` for everything not meant to be imported from outside the module (i.e.
  everything but `cmd/`).
- Explicit `http.Server` timeouts (`ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`).
- Configuration through environment variables with sensible defaults (`PORT`, `ALLOWED_ORIGIN`).

## How the principles apply

- **KISS**: a single `POST /api/v1/evaluate` endpoint. Standard `net/http` routing, no
  framework, no timeout machinery — the grammar has no loops, so the length bound is enough.
- **YAGNI**: no repositories, no ORM, no third-party logger, no middleware beyond the CORS the
  frontend needs. No operation history until it is requested.
- **DRY**: the operator catalogue, the allow-list and the domain errors live only in `model`;
  controller and service consume them.

## Testing and coverage

Unit tests ship with the code; a layer is not done until it is tested.

One test file per package, table-driven, with no case repeated across tables:

- `internal/model/expression_test.go` — the allow-list: every catalogue symbol accepted, and
  letters, injection attempts, invalid UTF-8 and over-long inputs rejected.
- `internal/service/evaluator_test.go` — the rewriting rules, the seven operations with
  precedence and rounding, every domain error path, and the defensive guards of the custom
  functions, reached directly because the evaluator cannot produce them.
- `internal/controller/evaluator_test.go` — `httptest` tests asserting the status code and the
  error payload for each mapping rule (400 / 422 / 500), plus CORS.

```bash
go test ./...                                   # run the suite
go test -coverprofile=coverage.out ./...        # coverage profile
go tool cover -func=coverage.out                # coverage summary per function
go tool cover -html=coverage.out                # HTML report
```

Targets: **≥ 80% module-wide** and **100% of the reachable branches in `internal/service`**.
The guards that only fire if the evaluator misbehaves (a recovered panic, a compile failure on
an already normalized expression) are deliberately exempt: covering them would mean weakening
the code to make it fail. Tests are hermetic: no network, no sleeps, no shared state.
