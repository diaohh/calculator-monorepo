# Backend — Context (Go)

Go 1.27 REST API built on the standard library (`net/http` + `encoding/json`).
Module: `backend`. Exposes the calculator operations. No database: the calculation is pure
and stateless. Everything — code, comments, tests — is written in English.

## Simplified clean architecture (3 layers)

Dependencies flow in one direction only: **Controller → Service → Model**.
No inner layer knows about an outer one.

```
backend/
├── cmd/api/main.go              # composition root: config, routes, server start-up
└── internal/
    ├── model/                   # data structures: requests, responses, domain errors
    │   ├── calculation.go       # Operation type, request/response types
    │   └── errors.go            # domain errors (ErrDivisionByZero, ErrNegativeRoot, ...)
    ├── controller/              # HTTP adapter
    │   ├── calculator_controller.go
    │   └── response.go          # JSON writing helpers and error → status mapping
    └── service/                 # business logic
        ├── calculator_service.go       # CalculatorService interface
        └── calculator_service_impl.go  # implementation
```

### Model layer (`internal/model`)
- Data types only: requests, responses, the operation enum and domain errors.
- **Zero dependencies**: it must not import `net/http`, `controller` or `service`.
- `json` tags on every exposed field.
- May hold intrinsic validation of the data (`func (o Operation) IsValid() bool`),
  never orchestration rules.

### Controller layer (`internal/controller`)
- The only layer that knows about HTTP. Its job is to **translate**, not to decide:
  1. Decode the body into the model request.
  2. Validate shape (well-formed JSON, required fields, known operation).
  3. Call the service.
  4. Map the result or the domain error to a status code and a JSON body.
- **No arithmetic here.**
- Error mapping is centralised in a single place (`response.go`):
  - Malformed JSON or missing fields → `400 Bad Request`
  - Unknown operation → `400 Bad Request`
  - Domain error (division by zero, negative root) → `422 Unprocessable Entity`
  - Unexpected → `500 Internal Server Error`

### Service layer (`internal/service`)
- Holds all calculation logic and business rules.
- A `CalculatorService` interface plus its implementation struct; the controller depends on
  the interface, not the struct (constructor injection from `main.go`).
- **Knows nothing about HTTP**: no `*http.Request`, no `http.ResponseWriter`.
- Returns the domain errors declared in `model`, never HTTP-flavoured errors.
- Pure and deterministic: same input, same output, no shared state.

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

- **KISS**: a single `POST /api/v1/calculate` endpoint carrying an `operation` field, instead
  of seven endpoints. Standard `net/http` routing, no framework.
- **YAGNI**: no repositories, no ORM, no third-party structured logger, no middleware beyond
  the CORS the frontend needs. No operation history until it is requested.
- **DRY**: the operation catalogue, its arity (one or two operands) and its errors live only
  in `model`; controller and service consume them.

## Testing and coverage

Unit tests ship with the code; a layer is not done until it is tested.

- `internal/service/calculator_service_impl_test.go` — table-driven tests covering every
  operation and its edge cases: division by zero, negative root, zero and negative
  exponents, percentage of zero, decimal precision.
- `internal/controller/calculator_controller_test.go` — `httptest` tests asserting the status
  code and error payload for each mapping rule (400 / 422 / 500) and the happy path.
- `internal/model` — tests for `Operation.IsValid` and any intrinsic validation.

```bash
go test ./...                                   # run the suite
go test -race ./...                             # race detector
go test -coverprofile=coverage.out ./...        # coverage profile
go tool cover -func=coverage.out                # coverage summary per function
go tool cover -html=coverage.out                # HTML report
```

Targets: **≥ 80% module-wide**, **100% of branches in `internal/service`**.
Tests are hermetic: no network, no sleeps, no shared state between cases.
