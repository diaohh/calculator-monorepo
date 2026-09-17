package controller

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"backend/internal/model"
)

// errorStatuses is the single place where a domain error becomes an HTTP answer: shape errors
// are 400, business errors are 422, and anything unknown falls through to 500.
var errorStatuses = []struct {
	err    error
	status int
	code   string
}{
	{model.ErrInvalidRequest, http.StatusBadRequest, "INVALID_REQUEST"},
	{model.ErrEmptyExpression, http.StatusBadRequest, "EMPTY_EXPRESSION"},
	{model.ErrExpressionTooLong, http.StatusBadRequest, "EXPRESSION_TOO_LONG"},
	{model.ErrInvalidCharacters, http.StatusBadRequest, "INVALID_CHARACTERS"},
	{model.ErrMalformedExpression, http.StatusUnprocessableEntity, "MALFORMED_EXPRESSION"},
	{model.ErrDivisionByZero, http.StatusUnprocessableEntity, "DIVISION_BY_ZERO"},
	{model.ErrNegativeRoot, http.StatusUnprocessableEntity, "NEGATIVE_ROOT"},
	{model.ErrResultOutOfRange, http.StatusUnprocessableEntity, "RESULT_OUT_OF_RANGE"},
}

const (
	internalErrorCode    = "INTERNAL_ERROR"
	internalErrorMessage = "the request could not be processed"
)

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("failed to write the response body: %v", err)
	}
}

func writeError(w http.ResponseWriter, err error) {
	for _, mapping := range errorStatuses {
		if errors.Is(err, mapping.err) {
			writeJSON(w, mapping.status, model.APIError{Code: mapping.code, Message: mapping.err.Error()})

			return
		}
	}

	// An unexpected error is logged but never described to the client, so internal details
	// cannot leak through the response.
	log.Printf("unexpected error while handling the request: %v", err)
	writeJSON(w, http.StatusInternalServerError, model.APIError{Code: internalErrorCode, Message: internalErrorMessage})
}
