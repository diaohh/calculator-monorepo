package model

import "errors"

// Domain errors carry no HTTP knowledge: the controller layer is the only place that turns
// them into status codes.
var (
	ErrInvalidRequest    = errors.New("the request body is not a valid evaluate request")
	ErrEmptyExpression   = errors.New("the expression is empty")
	ErrExpressionTooLong = errors.New("the expression is too long")
	ErrInvalidCharacters = errors.New("the expression contains characters that are not allowed")

	ErrMalformedExpression = errors.New("the expression is not a valid mathematical expression")
	ErrDivisionByZero      = errors.New("cannot divide by zero")
	ErrNegativeRoot        = errors.New("cannot take the square root of a negative number")
	ErrResultOutOfRange    = errors.New("the result is out of the representable range")
)

// APIError is the error body documented in docs/API.md.
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
