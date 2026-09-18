import { canAppendSymbol } from './validation'

/**
 * Writing is the single place the grammar rules are enforced: a symbol that cannot follow what
 * is already written is ignored, so clicks and physical keys cannot diverge.
 */
export function appendSymbol(expression: string, symbol: string): string {
  return canAppendSymbol(expression, symbol) ? expression + symbol : expression
}

export function removeLastSymbol(expression: string): string {
  return expression.slice(0, -1)
}

export function isEmpty(expression: string): boolean {
  return expression.trim() === ''
}
