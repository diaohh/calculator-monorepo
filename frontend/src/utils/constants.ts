import type { ApiErrorCode } from '../types/api'
import { MAX_EXPRESSION_LENGTH } from './validation'

export type CalculatorKeyVariant = 'digit' | 'operator' | 'command' | 'equals'

type BaseKey = {
  id: string
  label: string
  ariaLabel: string
  variant: CalculatorKeyVariant
  /** Values of `KeyboardEvent.key`, compared case-insensitively, that trigger this key. */
  keyboardKeys: string[]
  wide?: true
}

/**
 * The key catalogue is a discriminated union so that reading `symbol` is only possible once
 * the action has been narrowed to `append`, which keeps the press handler exhaustive without
 * optional fields to guard.
 */
export type CalculatorKeyDefinition =
  | (BaseKey & { action: 'append'; symbol: string })
  | (BaseKey & { action: 'clear' | 'backspace' | 'evaluate' })

/**
 * Single source of truth for the keypad: both the rendered grid and the physical keyboard
 * bindings are derived from this list, so a key is never declared in two places. The order is
 * the reading order of the grid (four columns, six rows).
 *
 * Formatting is kept by hand: one key per line reads as the grid it describes, which is worth
 * more here than the uniformity Prettier would impose.
 */
// prettier-ignore
export const CALCULATOR_KEYS: CalculatorKeyDefinition[] = [
  { id: 'clear',          label: 'AC', ariaLabel: 'Clear all',            action: 'clear',     variant: 'command',  keyboardKeys: ['Escape', 'Delete'] },
  { id: 'backspace',      label: '⌫',  ariaLabel: 'Delete last symbol',   action: 'backspace', variant: 'command',  keyboardKeys: ['Backspace'] },
  { id: 'group-open',     label: '(',  ariaLabel: 'Open parenthesis',     action: 'append',    variant: 'command',  keyboardKeys: ['('],              symbol: '(' },
  { id: 'group-close',    label: ')',  ariaLabel: 'Close parenthesis',    action: 'append',    variant: 'command',  keyboardKeys: [')'],              symbol: ')' },

  { id: 'square-root',    label: '√',  ariaLabel: 'Square root',          action: 'append',    variant: 'operator', keyboardKeys: ['r', 'q'],         symbol: '√' },
  { id: 'exponentiation', label: '^',  ariaLabel: 'Exponentiation',       action: 'append',    variant: 'operator', keyboardKeys: ['^'],              symbol: '^' },
  { id: 'percentage',     label: '%',  ariaLabel: 'Percentage',           action: 'append',    variant: 'operator', keyboardKeys: ['%'],              symbol: '%' },
  { id: 'division',       label: '÷',  ariaLabel: 'Divide',               action: 'append',    variant: 'operator', keyboardKeys: ['/'],              symbol: '/' },

  { id: 'seven',          label: '7',  ariaLabel: 'Seven',                action: 'append',    variant: 'digit',    keyboardKeys: ['7'],              symbol: '7' },
  { id: 'eight',          label: '8',  ariaLabel: 'Eight',                action: 'append',    variant: 'digit',    keyboardKeys: ['8'],              symbol: '8' },
  { id: 'nine',           label: '9',  ariaLabel: 'Nine',                 action: 'append',    variant: 'digit',    keyboardKeys: ['9'],              symbol: '9' },
  { id: 'multiplication', label: '×',  ariaLabel: 'Multiply',             action: 'append',    variant: 'operator', keyboardKeys: ['*'],              symbol: '*' },

  { id: 'four',           label: '4',  ariaLabel: 'Four',                 action: 'append',    variant: 'digit',    keyboardKeys: ['4'],              symbol: '4' },
  { id: 'five',           label: '5',  ariaLabel: 'Five',                 action: 'append',    variant: 'digit',    keyboardKeys: ['5'],              symbol: '5' },
  { id: 'six',            label: '6',  ariaLabel: 'Six',                  action: 'append',    variant: 'digit',    keyboardKeys: ['6'],              symbol: '6' },
  { id: 'subtraction',    label: '−',  ariaLabel: 'Subtract',             action: 'append',    variant: 'operator', keyboardKeys: ['-'],              symbol: '-' },

  { id: 'one',            label: '1',  ariaLabel: 'One',                  action: 'append',    variant: 'digit',    keyboardKeys: ['1'],              symbol: '1' },
  { id: 'two',            label: '2',  ariaLabel: 'Two',                  action: 'append',    variant: 'digit',    keyboardKeys: ['2'],              symbol: '2' },
  { id: 'three',          label: '3',  ariaLabel: 'Three',                action: 'append',    variant: 'digit',    keyboardKeys: ['3'],              symbol: '3' },
  { id: 'addition',       label: '+',  ariaLabel: 'Add',                  action: 'append',    variant: 'operator', keyboardKeys: ['+'],              symbol: '+' },

  { id: 'zero',           label: '0',  ariaLabel: 'Zero',                 action: 'append',    variant: 'digit',    keyboardKeys: ['0'],              symbol: '0', wide: true },
  { id: 'decimal-point',  label: '.',  ariaLabel: 'Decimal point',        action: 'append',    variant: 'digit',    keyboardKeys: ['.'],              symbol: '.' },
  { id: 'equals',         label: '=',  ariaLabel: 'Calculate the result', action: 'evaluate',  variant: 'equals',   keyboardKeys: ['Enter', '='] },
]

/**
 * The one place where a contract error code becomes something a person can read. The API also
 * sends a message, but it is written for a developer; these are written for the display.
 */
export const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_REQUEST: 'The request could not be understood.',
  EMPTY_EXPRESSION: 'Write an expression first.',
  EXPRESSION_TOO_LONG: `An expression cannot be longer than ${MAX_EXPRESSION_LENGTH} characters.`,
  INVALID_CHARACTERS: 'The expression contains symbols that are not allowed.',
  MALFORMED_EXPRESSION: 'That is not a complete expression.',
  DIVISION_BY_ZERO: 'Cannot divide by zero.',
  NEGATIVE_ROOT: 'Cannot take the square root of a negative number.',
  RESULT_OUT_OF_RANGE: 'The result is too large to display.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
}
