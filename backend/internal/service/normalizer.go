package service

import (
	"fmt"
	"strings"

	"backend/internal/model"
)

// normalize rewrites an expression written with the operator catalogue into the source
// language of the evaluator: whitespace is dropped, every number becomes a float literal so
// 1/2 is 0.5 and not 0, √x becomes sqrt(x) because the evaluator has no square root, and the
// postfix x% becomes (x/100.0) because % means modulo to the evaluator.
//
// The expression is walked by hand rather than rewritten with regular expressions because √
// binds to the operand on its right and % to the operand on its left, and finding those
// operands means balancing parentheses.
func normalize(expression string) (string, error) {
	input := []rune(strings.Join(strings.Fields(expression), ""))
	if len(input) == 0 {
		return "", model.ErrEmptyExpression
	}

	n := &normalizer{input: input}

	normalized, index, err := n.expression(0, len(input))
	if err != nil {
		return "", err
	}
	if index != len(input) {
		return "", fmt.Errorf("%w: unexpected %q", model.ErrMalformedExpression, string(input[index]))
	}

	return normalized, nil
}

type normalizer struct {
	input []rune
}

func (n *normalizer) expression(from, to int) (string, int, error) {
	text, index, err := n.operand(from, to)
	if err != nil {
		return "", 0, err
	}

	var normalized strings.Builder
	normalized.WriteString(text)

	for index < to {
		operator := n.input[index]
		if !isBinaryOperator(operator) {
			return "", 0, fmt.Errorf("%w: unexpected %q", model.ErrMalformedExpression, string(operator))
		}
		normalized.WriteRune(operator)

		text, index, err = n.operand(index+1, to)
		if err != nil {
			return "", 0, err
		}
		normalized.WriteString(text)
	}

	return normalized.String(), index, nil
}

// operand reads a sign, a square root, a parenthesised group or a number, and then applies
// every percentage sign that follows it.
func (n *normalizer) operand(from, to int) (string, int, error) {
	if from >= to {
		return "", 0, fmt.Errorf("%w: an operand was expected", model.ErrMalformedExpression)
	}

	var (
		text  string
		index int
		err   error
	)

	switch current := n.input[from]; {
	case current == model.SymbolAddition || current == model.SymbolSubtraction:
		text, index, err = n.operand(from+1, to)
		text = string(current) + text
	case current == model.SymbolSquareRoot:
		text, index, err = n.operand(from+1, to)
		text = squareRootFunction + "(" + text + ")"
	case current == model.SymbolGroupOpen:
		text, index, err = n.group(from, to)
	case isNumberStart(current):
		text, index, err = n.number(from, to)
	default:
		err = fmt.Errorf("%w: unexpected %q", model.ErrMalformedExpression, string(current))
	}
	if err != nil {
		return "", 0, err
	}

	for index < to && n.input[index] == model.SymbolPercentage {
		text = "(" + text + string(model.SymbolDivision) + percentDivisor + ")"
		index++
	}

	return text, index, nil
}

func (n *normalizer) group(from, to int) (string, int, error) {
	closing, err := n.matchingParenthesis(from, to)
	if err != nil {
		return "", 0, err
	}

	inner, _, err := n.expression(from+1, closing)
	if err != nil {
		return "", 0, err
	}

	return string(model.SymbolGroupOpen) + inner + string(model.SymbolGroupClose), closing + 1, nil
}

func (n *normalizer) matchingParenthesis(from, to int) (int, error) {
	depth := 0

	for index := from; index < to; index++ {
		switch n.input[index] {
		case model.SymbolGroupOpen:
			depth++
		case model.SymbolGroupClose:
			depth--
			if depth == 0 {
				return index, nil
			}
		}
	}

	return 0, fmt.Errorf("%w: unbalanced parentheses", model.ErrMalformedExpression)
}

func (n *normalizer) number(from, to int) (string, int, error) {
	index, decimalPoints := from, 0

	for index < to && isNumberStart(n.input[index]) {
		if n.input[index] == model.SymbolDecimalPoint {
			decimalPoints++
		}
		index++
	}

	literal := string(n.input[from:index])
	if decimalPoints > 1 || literal == string(model.SymbolDecimalPoint) {
		return "", 0, fmt.Errorf("%w: invalid number %q", model.ErrMalformedExpression, literal)
	}

	return asFloatLiteral(literal), index, nil
}

func asFloatLiteral(literal string) string {
	decimalPoint := string(model.SymbolDecimalPoint)

	switch {
	case !strings.Contains(literal, decimalPoint):
		return literal + decimalPoint + "0"
	case strings.HasPrefix(literal, decimalPoint):
		return "0" + literal
	case strings.HasSuffix(literal, decimalPoint):
		return literal + "0"
	}

	return literal
}

func isBinaryOperator(symbol rune) bool {
	switch symbol {
	case model.SymbolAddition, model.SymbolSubtraction, model.SymbolMultiplication,
		model.SymbolDivision, model.SymbolExponentiation:
		return true
	}

	return false
}

func isNumberStart(symbol rune) bool {
	return (symbol >= '0' && symbol <= '9') || symbol == model.SymbolDecimalPoint
}
