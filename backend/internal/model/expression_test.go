package model_test

import (
	"errors"
	"strings"
	"testing"

	"backend/internal/model"
)

func TestEvaluateRequestValidate(t *testing.T) {
	tests := []struct {
		name       string
		expression string
		want       error
	}{
		{"a plain operation is accepted", "2+3", nil},
		{"every symbol of the catalogue is accepted", "√(2.5+3)^2-10%*4/2", nil},
		{"surrounding whitespace is accepted", "  2 + 3  ", nil},
		{"an expression of the maximum length is accepted", strings.Repeat("1", model.MaxExpressionLength), nil},
		{"an empty expression is rejected", "", model.ErrEmptyExpression},
		{"a blank expression is rejected", "   ", model.ErrEmptyExpression},
		{"an over-long expression is rejected", strings.Repeat("1", model.MaxExpressionLength+1), model.ErrExpressionTooLong},
		{"invalid utf-8 is rejected", string([]byte{0xff, 0xfe}), model.ErrInvalidCharacters},
		{"function names are rejected", "sqrt(9)", model.ErrInvalidCharacters},
		{"a shell injection attempt is rejected", "2+3; rm -rf /", model.ErrInvalidCharacters},
		{"an evaluator builtin call is rejected", `len("abc")`, model.ErrInvalidCharacters},
		{"logical operators are rejected", "1 || true", model.ErrInvalidCharacters},
		{"variable interpolation is rejected", "2+${x}", model.ErrInvalidCharacters},
		{"a pipe is rejected", "2 | upper", model.ErrInvalidCharacters},
		{"an emoji is rejected", "2+🙂", model.ErrInvalidCharacters},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := model.EvaluateRequest{Expression: test.expression}.Validate()

			if !errors.Is(got, test.want) {
				t.Fatalf("Validate() = %v, want %v", got, test.want)
			}
		})
	}
}
