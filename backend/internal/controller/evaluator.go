package controller

import (
	"encoding/json"
	"fmt"
	"net/http"

	"backend/internal/model"
	"backend/internal/service"
)

// maxBodyBytes stops an oversized body from being buffered; the expression itself is bounded
// by model.MaxExpressionLength.
const maxBodyBytes = 4 << 10

// Evaluator maps the HTTP request onto the evaluator service. It performs no arithmetic: it
// decodes, validates the shape, delegates and translates the outcome.
type Evaluator struct {
	evaluator service.Evaluator
}

func NewEvaluator(evaluator service.Evaluator) *Evaluator {
	return &Evaluator{evaluator: evaluator}
}

func (c *Evaluator) Evaluate(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	var request model.EvaluateRequest
	if err := decoder.Decode(&request); err != nil {
		writeError(w, fmt.Errorf("%w: %s", model.ErrInvalidRequest, err))

		return
	}

	// The allow-list runs before the service is reached, so nothing outside the operator
	// catalogue ever gets close to the evaluator.
	if err := request.Validate(); err != nil {
		writeError(w, err)

		return
	}

	result, err := c.evaluator.Evaluate(request.Expression)
	if err != nil {
		writeError(w, err)

		return
	}

	writeJSON(w, http.StatusOK, model.EvaluateResponse{Expression: request.Expression, Result: result})
}

func (c *Evaluator) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
