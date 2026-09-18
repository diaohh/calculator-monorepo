/**
 * Mirror of the contract in docs/API.md. It is duplicated on purpose (ADR-001): Go and
 * TypeScript declare the same shapes and a change to one is a change to the other, in the
 * same commit.
 */

export type EvaluateRequest = {
  expression: string
}

export type EvaluateResponse = {
  expression: string
  result: number
}

export type ApiErrorCode =
  | 'INVALID_REQUEST'
  | 'EMPTY_EXPRESSION'
  | 'EXPRESSION_TOO_LONG'
  | 'INVALID_CHARACTERS'
  | 'MALFORMED_EXPRESSION'
  | 'DIVISION_BY_ZERO'
  | 'NEGATIVE_ROOT'
  | 'RESULT_OUT_OF_RANGE'
  | 'INTERNAL_ERROR'

export type ApiError = {
  code: ApiErrorCode
  message: string
}
