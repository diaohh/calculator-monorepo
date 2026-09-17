# API Contract

Base URL: `http://localhost:8080/api/v1`
Format: JSON (`Content-Type: application/json`) on both request and response.

This document is the source of truth for the contract. The types in
`backend/internal/model` and `frontend/src/types` must mirror it exactly.

---

## `POST /calculate`

Runs an arithmetic operation.

### Request

```json
{
  "operation": "add",
  "operandA": 12.5,
  "operandB": 3
}
```

| Field       | Type   | Required    | Description |
|-------------|--------|-------------|-------------|
| `operation` | string | yes         | One of the keys in the operations table |
| `operandA`  | number | yes         | First operand (base for `power`, value for `percent`) |
| `operandB`  | number | conditional | Second operand; omitted for `sqrt` |

### Operations

| Key        | Operation      | Formula       | Constraint |
|------------|----------------|---------------|------------|
| `add`      | Addition       | `a + b`       | — |
| `subtract` | Subtraction    | `a - b`       | — |
| `multiply` | Multiplication | `a * b`       | — |
| `divide`   | Division       | `a / b`       | `b ≠ 0` |
| `power`    | Exponentiation | `a ^ b`       | — |
| `sqrt`     | Square root    | `√a`          | `a ≥ 0` |
| `percent`  | Percentage     | `a * b / 100` | — |

### `200 OK`

```json
{
  "operation": "add",
  "operandA": 12.5,
  "operandB": 3,
  "result": 15.5
}
```

### Error response

```json
{
  "code": "DIVISION_BY_ZERO",
  "message": "cannot divide by zero"
}
```

| Status | `code`                  | Cause |
|--------|-------------------------|-------|
| 400    | `INVALID_REQUEST`       | Malformed JSON or missing fields |
| 400    | `UNSUPPORTED_OPERATION` | `operation` is not in the table |
| 422    | `DIVISION_BY_ZERO`      | `divide` with `operandB = 0` |
| 422    | `NEGATIVE_ROOT`         | `sqrt` with `operandA < 0` |
| 500    | `INTERNAL_ERROR`        | Unexpected failure |

---

## `GET /health`

Liveness probe used by the Docker healthcheck.

`200 OK`:

```json
{ "status": "ok" }
```
