package model

import (
	"regexp"
	"strings"
	"unicode/utf8"
)

// Operator catalogue: the only symbols a client may send, and the single source of truth for
// both the validation pattern below and the service normalizer.
const (
	SymbolAddition       = '+'
	SymbolSubtraction    = '-'
	SymbolMultiplication = '*'
	SymbolDivision       = '/'
	SymbolExponentiation = '^'
	SymbolSquareRoot     = '√' // prefix, binds to the operand on its right: √9+7 is 10
	SymbolPercentage     = '%' // postfix, means "divided by one hundred": 10% is 0.1
	SymbolGroupOpen      = '('
	SymbolGroupClose     = ')'
	SymbolDecimalPoint   = '.'
)

// MaxExpressionLength bounds the input. The grammar has no loops or variables, so bounding
// the length also bounds how much work an expression can ever cost.
const MaxExpressionLength = 256

// expressionPattern is an allow-list, not a sanitiser: anything outside the operator
// catalogue is rejected instead of escaped. Since no letter can reach the evaluator, no
// identifier, function call or string literal can be injected through the expression.
var expressionPattern = regexp.MustCompile(`^[0-9+\-*/^%√().\s]+$`)

type EvaluateRequest struct {
	Expression string `json:"expression"`
}

type EvaluateResponse struct {
	Expression string  `json:"expression"`
	Result     float64 `json:"result"`
}

// Validate checks the shape of the expression, not its arithmetic: whether it is well formed
// as mathematics is decided later, by the service.
func (r EvaluateRequest) Validate() error {
	expression := strings.TrimSpace(r.Expression)

	switch {
	case expression == "":
		return ErrEmptyExpression
	case !utf8.ValidString(expression):
		return ErrInvalidCharacters
	case utf8.RuneCountInString(expression) > MaxExpressionLength:
		return ErrExpressionTooLong
	case !expressionPattern.MatchString(expression):
		return ErrInvalidCharacters
	}

	return nil
}
