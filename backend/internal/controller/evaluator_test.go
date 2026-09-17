package controller_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"backend/internal/controller"
	"backend/internal/model"
)

type stubEvaluator struct {
	result float64
	err    error
	called bool
}

func (s *stubEvaluator) Evaluate(string) (float64, error) {
	s.called = true

	return s.result, s.err
}

func evaluate(t *testing.T, evaluator *stubEvaluator, body string) *httptest.ResponseRecorder {
	t.Helper()

	request := httptest.NewRequest(http.MethodPost, "/api/v1/evaluate", strings.NewReader(body))
	recorder := httptest.NewRecorder()
	controller.NewEvaluator(evaluator).Evaluate(recorder, request)

	return recorder
}

func decodeError(t *testing.T, recorder *httptest.ResponseRecorder) model.APIError {
	t.Helper()

	var apiError model.APIError
	if err := json.NewDecoder(recorder.Body).Decode(&apiError); err != nil {
		t.Fatalf("the error body could not be decoded: %v", err)
	}

	return apiError
}

func TestEvaluateReturnsTheResult(t *testing.T) {
	recorder := evaluate(t, &stubEvaluator{result: 14}, `{"expression":"2+3*4"}`)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if contentType := recorder.Header().Get("Content-Type"); contentType != "application/json" {
		t.Fatalf("Content-Type = %q, want application/json", contentType)
	}

	var response model.EvaluateResponse
	if err := json.NewDecoder(recorder.Body).Decode(&response); err != nil {
		t.Fatalf("the response body could not be decoded: %v", err)
	}
	if response.Result != 14 || response.Expression != "2+3*4" {
		t.Fatalf("response = %+v, want the expression and its result", response)
	}
}

func TestEvaluateRejectsBadRequestsBeforeTheService(t *testing.T) {
	tests := []struct {
		name string
		body string
		code string
	}{
		{"a malformed body", `{"expression":`, "INVALID_REQUEST"},
		{"an unknown field", `{"expression":"2+3","rounding":2}`, "INVALID_REQUEST"},
		{"a missing expression", `{}`, "EMPTY_EXPRESSION"},
		{"a blank expression", `{"expression":"   "}`, "EMPTY_EXPRESSION"},
		{"an over-long expression", `{"expression":"` + strings.Repeat("1", model.MaxExpressionLength+1) + `"}`, "EXPRESSION_TOO_LONG"},
		{"an injection attempt", `{"expression":"2+3; rm -rf /"}`, "INVALID_CHARACTERS"},
		{"a call to an evaluator builtin", `{"expression":"abs(-2)"}`, "INVALID_CHARACTERS"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			evaluator := &stubEvaluator{}

			recorder := evaluate(t, evaluator, test.body)

			if recorder.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
			}
			if code := decodeError(t, recorder).Code; code != test.code {
				t.Fatalf("code = %q, want %q", code, test.code)
			}
			if evaluator.called {
				t.Fatal("the service was reached although the request was rejected")
			}
		})
	}
}

func TestEvaluateMapsDomainErrors(t *testing.T) {
	tests := []struct {
		name string
		err  error
		code string
	}{
		{"a division by zero", model.ErrDivisionByZero, "DIVISION_BY_ZERO"},
		{"a negative root", model.ErrNegativeRoot, "NEGATIVE_ROOT"},
		{"a malformed expression", model.ErrMalformedExpression, "MALFORMED_EXPRESSION"},
		{"a result out of range", model.ErrResultOutOfRange, "RESULT_OUT_OF_RANGE"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			recorder := evaluate(t, &stubEvaluator{err: test.err}, `{"expression":"10/0"}`)

			if recorder.Code != http.StatusUnprocessableEntity {
				t.Fatalf("status = %d, want %d", recorder.Code, http.StatusUnprocessableEntity)
			}
			if code := decodeError(t, recorder).Code; code != test.code {
				t.Fatalf("code = %q, want %q", code, test.code)
			}
		})
	}
}

func TestEvaluateHidesUnexpectedErrors(t *testing.T) {
	evaluator := &stubEvaluator{err: errors.New("the evaluation panicked: index out of range")}

	recorder := evaluate(t, evaluator, `{"expression":"2+3"}`)

	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusInternalServerError)
	}

	apiError := decodeError(t, recorder)
	if apiError.Code != "INTERNAL_ERROR" {
		t.Fatalf("code = %q, want INTERNAL_ERROR", apiError.Code)
	}
	if strings.Contains(apiError.Message, "panicked") {
		t.Fatalf("message = %q, it leaks the internal error", apiError.Message)
	}
}

func TestHealthReportsTheService(t *testing.T) {
	recorder := httptest.NewRecorder()

	controller.NewEvaluator(&stubEvaluator{}).Health(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/health", nil))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if body := strings.TrimSpace(recorder.Body.String()); body != `{"status":"ok"}` {
		t.Fatalf("body = %s, want the ok status", body)
	}
}

func TestCORS(t *testing.T) {
	tests := []struct {
		name          string
		method        string
		wantStatus    int
		wantForwarded bool
	}{
		{"a preflight is answered without reaching the handler", http.MethodOptions, http.StatusNoContent, false},
		{"any other request is forwarded", http.MethodPost, http.StatusTeapot, true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			forwarded := false
			handler := controller.CORS("http://localhost:5173", http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				forwarded = true
				w.WriteHeader(http.StatusTeapot)
			}))

			recorder := httptest.NewRecorder()
			handler.ServeHTTP(recorder, httptest.NewRequest(test.method, "/api/v1/evaluate", nil))

			if recorder.Code != test.wantStatus {
				t.Fatalf("status = %d, want %d", recorder.Code, test.wantStatus)
			}
			if forwarded != test.wantForwarded {
				t.Fatalf("the request reached the handler = %v, want %v", forwarded, test.wantForwarded)
			}
			if origin := recorder.Header().Get("Access-Control-Allow-Origin"); origin != "http://localhost:5173" {
				t.Fatalf("Access-Control-Allow-Origin = %q, want the configured origin", origin)
			}
		})
	}
}
