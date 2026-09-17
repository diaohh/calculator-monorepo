package service

import (
	"errors"
	"fmt"
	"testing"

	"backend/internal/model"
)

func TestNormalize(t *testing.T) {
	tests := []struct {
		name       string
		expression string
		want       string
	}{
		{"integers become float literals", "2+3", "2.0+3.0"},
		{"partial decimals are completed", ".5+5.", "0.5+5.0"},
		{"whitespace is dropped", " 2 +  3 ", "2.0+3.0"},
		{"a square root binds to its operand only", "√9+7", "sqrt(9.0)+7.0"},
		{"a square root accepts a group", "√(4+5)", "sqrt((4.0+5.0))"},
		{"a nested square root is kept", "√√16", "sqrt(sqrt(16.0))"},
		{"a percentage takes only its own operand", "200*10%", "200.0*(10.0/100.0)"},
		{"a percentage applies to a group", "(2+3)%", "((2.0+3.0)/100.0)"},
		{"chained percentages are applied in order", "50%%", "((50.0/100.0)/100.0)"},
		{"a unary sign is preserved", "-4+1", "-4.0+1.0"},
		{"groups and exponents are passed through", "((2+3)*4)^2", "((2.0+3.0)*4.0)^2.0"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got, err := normalize(test.expression)
			if err != nil {
				t.Fatalf("normalize(%q) returned an unexpected error: %v", test.expression, err)
			}
			if got != test.want {
				t.Fatalf("normalize(%q) = %q, want %q", test.expression, got, test.want)
			}
		})
	}
}

func TestEvaluate(t *testing.T) {
	tests := []struct {
		name       string
		expression string
		want       float64
	}{
		{"addition", "2+3", 5},
		{"subtraction", "10-4.5", 5.5},
		{"multiplication", "6*7", 42},
		{"division produces decimals", "1/2", 0.5},
		{"a periodic division is rounded", "1/3", 0.3333333333},
		{"exponentiation", "2^10", 1024},
		{"a negative exponent", "2^-2", 0.25},
		{"a square root", "√81", 9},
		{"a square root of a group", "√(4+5)^2", 9},
		{"a percentage of a value", "200*10%", 20},
		{"a percentage added to a value", "200+10%", 200.1},
		{"operator precedence", "2+3*4", 14},
		{"parentheses override precedence", "(2+3)*4", 20},
		{"a unary minus", "-4+10", 6},
		{"floating point noise is rounded away", "0.1+0.2", 0.3},
		{"a value too large to round is returned untouched", "10^16", 1e16},
		{"a full expression", "√(2+2)*3+50%-1", 5.5},
	}

	evaluator := NewEvaluator()

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got, err := evaluator.Evaluate(test.expression)
			if err != nil {
				t.Fatalf("Evaluate(%q) returned an unexpected error: %v", test.expression, err)
			}
			if got != test.want {
				t.Fatalf("Evaluate(%q) = %v, want %v", test.expression, got, test.want)
			}
		})
	}
}

// Every rejection path, whether it is caught while normalizing or while evaluating, must come
// back as a domain error and as a zero result: a display can do nothing with a NaN.
func TestEvaluateReturnsDomainErrors(t *testing.T) {
	tests := []struct {
		name       string
		expression string
		want       error
	}{
		{"a division by a literal zero", "10/0", model.ErrDivisionByZero},
		{"a division by a group that evaluates to zero", "10/(5-5)", model.ErrDivisionByZero},
		{"a square root of a negative literal", "√-4", model.ErrNegativeRoot},
		{"a square root of a negative group", "√(3-5)", model.ErrNegativeRoot},
		{"a result beyond the representable range", "9^9^9", model.ErrResultOutOfRange},
		{"a subtraction of two infinities", "10^400-10^400", model.ErrMalformedExpression},
		{"a trailing operator", "2+", model.ErrMalformedExpression},
		{"two consecutive binary operators", "2*/3", model.ErrMalformedExpression},
		{"an unclosed group", "(2+3", model.ErrMalformedExpression},
		{"an unopened group", "2+3)", model.ErrMalformedExpression},
		{"an empty group", "()", model.ErrMalformedExpression},
		{"a percentage without an operand", "%5", model.ErrMalformedExpression},
		{"a square root without an operand", "√", model.ErrMalformedExpression},
		{"a number with two decimal points", "1.2.3", model.ErrMalformedExpression},
		{"an empty expression", "", model.ErrEmptyExpression},
		{"a blank expression", "   ", model.ErrEmptyExpression},
	}

	evaluator := NewEvaluator()

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got, err := evaluator.Evaluate(test.expression)

			if !errors.Is(err, test.want) {
				t.Fatalf("Evaluate(%q) = %v, %v, want error %v", test.expression, got, err, test.want)
			}
			if got != 0 {
				t.Fatalf("Evaluate(%q) returned %v alongside an error, want 0", test.expression, got)
			}
		})
	}
}

// The custom functions are registered with a float64 signature, so a non-numeric argument can
// only arrive if that registration ever changes. These cases pin the guard that keeps such a
// change from reaching the caller as a panic.
func TestEvaluationGuards(t *testing.T) {
	tests := []struct {
		name string
		call func() (any, error)
	}{
		{"a square root of a string", func() (any, error) { return squareRoot("nine") }},
		{"a division with a string dividend", func() (any, error) { return divide("ten", 2.0) }},
		{"a division with a string divisor", func() (any, error) { return divide(10.0, "two") }},
		{"an unrecognised evaluator failure", func() (any, error) { return nil, asDomainError(fmt.Errorf("boom")) }},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got, err := test.call()

			if !errors.Is(err, model.ErrMalformedExpression) {
				t.Fatalf("call() = %v, %v, want %v", got, err, model.ErrMalformedExpression)
			}
		})
	}
}
