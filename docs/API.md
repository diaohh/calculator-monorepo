# API Contract

Base URL: `http://localhost:8080/api/v1`
Format: JSON (`Content-Type: application/json`) on both request and response.

This document is the source of truth for the contract. The types in
`backend/internal/model` and `frontend/src/types` must mirror it exactly.

---

## `POST /evaluate`

Evaluates a mathematical expression sent as a single string.

### Request

```json
{ "expression": "2+3*√9" }
```

| Field        | Type   | Required | Description |
|--------------|--------|----------|-------------|
| `expression` | string | yes      | The expression, written with the operator catalogue below. At most 256 characters. |

Unknown fields are rejected.

### Operator catalogue

These are the only symbols accepted. Anything else — a letter, a semicolon, a quote — is
rejected before the expression reaches the evaluator.

| Symbol  | Operation      | Position | Example     | Result |
|---------|----------------|----------|-------------|--------|
| `+`     | Addition       | binary   | `2+3`       | `5`    |
| `-`     | Subtraction    | binary, also unary sign | `10-4`, `-4` | `6`, `-4` |
| `*`     | Multiplication | binary   | `6*7`       | `42`   |
| `/`     | Division       | binary   | `9/3`       | `3`    |
| `^`     | Exponentiation | binary   | `2^10`      | `1024` |
| `√`     | Square root    | prefix   | `√81`       | `9`    |
| `%`     | Percentage     | postfix  | `200*10%`   | `20`   |
| `( )`   | Grouping       | —        | `(2+3)*4`   | `20`   |
| `.`     | Decimal point  | —        | `2.5+1`     | `3.5`  |
| `0`–`9` | Digits         | —        | —           | —      |

Two rules worth knowing:

- `√` binds to the operand immediately on its right: `√9+7` is `3+7` = `10`, not `√16`.
- `%` means "divided by one hundred": `10%` is `0.1`, so `200*10%` is `20` and `200+10%`
  is `200.1`.

Whitespace is ignored, so `2 + 3` and `2+3` are the same expression.

### `200 OK`

```json
{
  "expression": "2+3*√9",
  "result": 11
}
```

`result` is a number rounded to 10 decimals, so `0.1+0.2` answers `0.3` instead of
`0.30000000000000004`.

### Error response

```json
{
  "code": "DIVISION_BY_ZERO",
  "message": "cannot divide by zero"
}
```

| Status | `code`                 | Cause |
|--------|------------------------|-------|
| 400    | `INVALID_REQUEST`      | Malformed JSON body or an unknown field |
| 400    | `EMPTY_EXPRESSION`     | Missing or blank `expression` |
| 400    | `EXPRESSION_TOO_LONG`  | More than 256 characters |
| 400    | `INVALID_CHARACTERS`   | A symbol outside the operator catalogue |
| 422    | `MALFORMED_EXPRESSION` | Valid symbols in an invalid order: `2+`, `(2+3`, `1.2.3` |
| 422    | `DIVISION_BY_ZERO`     | `10/0`, `10/(5-5)` |
| 422    | `NEGATIVE_ROOT`        | `√-4`, `√(3-5)` |
| 422    | `RESULT_OUT_OF_RANGE`  | The result is not a finite number: `9^9^9` |
| 500    | `INTERNAL_ERROR`       | Unexpected failure; the detail is logged, never returned |

### Examples

```bash
curl -X POST http://localhost:8080/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{"expression":"(2+3)*4"}'
# {"expression":"(2+3)*4","result":20}

curl -X POST http://localhost:8080/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{"expression":"10/0"}'
# 422 {"code":"DIVISION_BY_ZERO","message":"cannot divide by zero"}

curl -X POST http://localhost:8080/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{"expression":"abs(-2)"}'
# 400 {"code":"INVALID_CHARACTERS","message":"the expression contains characters that are not allowed"}
```

On a shell that does not pass UTF-8 through unchanged (Windows terminals, for instance), send
the square root JSON-escaped — `{"expression":"√81"}` — or the symbol will be mangled
before it leaves the client and the API will answer `INVALID_CHARACTERS`.

---

## `GET /health`

Liveness probe used by the Docker healthcheck.

`200 OK`:

```json
{ "status": "ok" }
```
