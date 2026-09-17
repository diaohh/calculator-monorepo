package service

import (
	"errors"
	"fmt"
	"math"

	"backend/internal/model"

	"github.com/expr-lang/expr"
	"github.com/expr-lang/expr/ast"
)

const (
	squareRootFunction = "sqrt"
	divisionFunction   = "div"
	percentDivisor     = "100.0"

	// Rounding removes the binary floating point noise (0.1 + 0.2) without losing precision a
	// display can show. Past roundingLimit the decimals carry no information and scaling the
	// value would overflow, so it is left untouched.
	decimalPlaces = 10
	roundingLimit = 1e15
)

type exprEvaluator struct {
	options []expr.Option
}

func NewEvaluator() Evaluator {
	return &exprEvaluator{
		options: []expr.Option{
			expr.AsFloat64(),
			expr.Function(squareRootFunction, squareRoot, new(func(float64) float64)),
			expr.Function(divisionFunction, divide, new(func(float64, float64) float64)),
			expr.Patch(divisionPatcher{}),
		},
	}
}

func (e *exprEvaluator) Evaluate(expression string) (result float64, err error) {
	// The evaluator is third-party code: a panic inside it becomes a controlled error instead
	// of taking the process down.
	defer func() {
		if recovered := recover(); recovered != nil {
			result, err = 0, fmt.Errorf("the evaluation panicked: %v", recovered)
		}
	}()

	normalized, err := normalize(expression)
	if err != nil {
		return 0, err
	}

	program, err := expr.Compile(normalized, e.options...)
	if err != nil {
		return 0, fmt.Errorf("%w: %s", model.ErrMalformedExpression, err)
	}

	output, err := expr.Run(program, nil)
	if err != nil {
		return 0, asDomainError(err)
	}

	value, isNumber := output.(float64)
	if !isNumber {
		return 0, fmt.Errorf("unexpected result type %T", output)
	}

	switch {
	case math.IsInf(value, 0):
		return 0, model.ErrResultOutOfRange
	case math.IsNaN(value):
		return 0, model.ErrMalformedExpression
	}

	return round(value), nil
}

func squareRoot(params ...any) (any, error) {
	value, isNumber := params[0].(float64)
	if !isNumber {
		return nil, fmt.Errorf("%w: a square root expects a number", model.ErrMalformedExpression)
	}
	if value < 0 {
		return nil, model.ErrNegativeRoot
	}

	return math.Sqrt(value), nil
}

// divide backs every division in the expression, so dividing by zero becomes a domain error
// instead of a silent infinity.
func divide(params ...any) (any, error) {
	dividend, dividendIsNumber := params[0].(float64)
	divisor, divisorIsNumber := params[1].(float64)

	if !dividendIsNumber || !divisorIsNumber {
		return nil, fmt.Errorf("%w: a division expects numbers", model.ErrMalformedExpression)
	}
	if divisor == 0 {
		return nil, model.ErrDivisionByZero
	}

	return dividend / divisor, nil
}

// divisionPatcher rewrites every binary division node into a call to divide before the
// expression is compiled.
type divisionPatcher struct{}

func (divisionPatcher) Visit(node *ast.Node) {
	binary, isBinary := (*node).(*ast.BinaryNode)
	if !isBinary || binary.Operator != string(model.SymbolDivision) {
		return
	}

	ast.Patch(node, &ast.CallNode{
		Callee:    &ast.IdentifierNode{Value: divisionFunction},
		Arguments: []ast.Node{binary.Left, binary.Right},
	})
}

func asDomainError(err error) error {
	knownErrors := []error{model.ErrDivisionByZero, model.ErrNegativeRoot, model.ErrMalformedExpression}

	for _, knownError := range knownErrors {
		if errors.Is(err, knownError) {
			return knownError
		}
	}

	return fmt.Errorf("%w: %s", model.ErrMalformedExpression, err)
}

func round(value float64) float64 {
	if math.Abs(value) >= roundingLimit {
		return value
	}

	factor := math.Pow(10, decimalPlaces)

	return math.Round(value*factor) / factor
}
