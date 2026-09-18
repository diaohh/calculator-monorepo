/**
 * Mirrors `model.MaxExpressionLength` in the backend (docs/API.md): beyond this the API
 * answers `EXPRESSION_TOO_LONG`, so the keypad stops writing instead of building a request
 * that is known to fail.
 */
export const MAX_EXPRESSION_LENGTH = 256

const BINARY_OPERATORS = '+-*/^'
const SQUARE_ROOT = '√'

function isDigit(character: string): boolean {
  return character >= '0' && character <= '9'
}

function isBinaryOperator(character: string): boolean {
  return BINARY_OPERATORS.includes(character)
}

/** True when the expression so far ends with a finished operand, the only place a binary operator or a closing parenthesis can follow. */
function endsWithOperand(expression: string): boolean {
  const last = expression.at(-1) ?? ''

  return isDigit(last) || last === ')' || last === '%'
}

/** True where a new operand may begin: at the start, inside a fresh group, or right after an operator. */
function acceptsOperand(expression: string): boolean {
  const last = expression.at(-1) ?? ''

  return last === '' || last === '(' || last === SQUARE_ROOT || isBinaryOperator(last)
}

function openGroupCount(expression: string): number {
  let open = 0

  for (const character of expression) {
    if (character === '(') {
      open += 1
    } else if (character === ')') {
      open -= 1
    }
  }

  return open
}

/** Whether the number currently being typed already carries a decimal point, which would make a second one invalid. */
function currentNumberHasDecimalPoint(expression: string): boolean {
  for (let index = expression.length - 1; index >= 0; index -= 1) {
    const character = expression[index]

    if (character === '.') {
      return true
    }

    if (!isDigit(character)) {
      return false
    }
  }

  return false
}

/**
 * Decides whether a symbol may be written at the end of the current expression.
 *
 * This is a grammar guard, not a parser: it only looks at what the expression ends with, which
 * is enough to rule out the sequences a person produces by pressing keys in a row — `2**3`,
 * `2+`, `()` — before they cost a round trip. Whether the whole expression is well formed is
 * still the backend's call (ADR-002), so `2+` can be written and only fails on `=`.
 *
 * `-` is the one symbol with two meanings: it is both subtraction and the sign of a negative
 * number, so it is accepted almost anywhere. `(` is deliberately allowed after another `(`,
 * because nesting groups — `((2+3)*(4+5))` — cannot be typed otherwise.
 */
export function canAppendSymbol(expression: string, symbol: string): boolean {
  if (expression.length + symbol.length > MAX_EXPRESSION_LENGTH) {
    return false
  }

  const last = expression.at(-1) ?? ''

  if (isDigit(symbol)) {
    return last !== ')' && last !== '%'
  }

  switch (symbol) {
    case '.':
      return isDigit(last) && !currentNumberHasDecimalPoint(expression)
    case '-':
      // A sign may follow an operator, but a run of them means nothing.
      return last !== '-' && last !== '.'
    case '%':
      return isDigit(last) || last === ')'
    case ')':
      return openGroupCount(expression) > 0 && endsWithOperand(expression)
    case '(':
    case SQUARE_ROOT:
      return acceptsOperand(expression)
    default:
      return isBinaryOperator(symbol) && endsWithOperand(expression)
  }
}
