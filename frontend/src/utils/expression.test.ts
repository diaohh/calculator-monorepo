import { describe, expect, it } from 'vitest'
import { appendSymbol, isEmpty, removeLastSymbol } from './expression'
import { MAX_EXPRESSION_LENGTH } from './validation'

describe('appendSymbol', () => {
  it('adds the symbol at the end', () => {
    expect(appendSymbol('2+', '3')).toBe('2+3')
  })

  it('leaves the expression untouched once the maximum length is reached', () => {
    const expression = '1'.repeat(MAX_EXPRESSION_LENGTH)

    expect(appendSymbol(expression, '2')).toBe(expression)
  })

  it('ignores a symbol that cannot follow what is written', () => {
    expect(appendSymbol('2*', '*')).toBe('2*')
  })

  it('still accepts a minus as the sign of a negative number', () => {
    expect(appendSymbol('2*', '-')).toBe('2*-')
  })
})

describe('removeLastSymbol', () => {
  it('drops the last symbol', () => {
    expect(removeLastSymbol('2+3')).toBe('2+')
  })

  it('answers an empty string when there is nothing to remove', () => {
    expect(removeLastSymbol('')).toBe('')
  })
})

describe('isEmpty', () => {
  it.each([
    ['', true],
    ['   ', true],
    ['0', false],
  ])('answers %j for %j', (expression, expected) => {
    expect(isEmpty(expression)).toBe(expected)
  })
})
