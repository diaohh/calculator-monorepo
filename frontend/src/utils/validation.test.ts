import { describe, expect, it } from 'vitest'
import { MAX_EXPRESSION_LENGTH, canAppendSymbol } from './validation'

describe('canAppendSymbol', () => {
  it('stops writing at the maximum length', () => {
    expect(canAppendSymbol('1'.repeat(MAX_EXPRESSION_LENGTH - 1), '2')).toBe(true)
    expect(canAppendSymbol('1'.repeat(MAX_EXPRESSION_LENGTH), '2')).toBe(false)
  })

  it.each([
    ['', true],
    ['2+', true],
    ['√', true],
    ['(', true],
    ['(2+3)', false],
    ['10%', false],
  ])('writes a digit after %j: %j', (expression, expected) => {
    expect(canAppendSymbol(expression, '7')).toBe(expected)
  })

  it.each([
    ['2', true],
    ['(2+3)', true],
    ['10%', true],
    ['', false],
    ['2*', false],
    ['(', false],
    ['√', false],
  ])('writes a binary operator after %j: %j', (expression, expected) => {
    expect(canAppendSymbol(expression, '*')).toBe(expected)
  })

  it.each(['+', '/', '^'])('applies the same rule to %j', (operator) => {
    expect(canAppendSymbol('2', operator)).toBe(true)
    expect(canAppendSymbol('2*', operator)).toBe(false)
  })

  it.each([
    ['', true],
    ['2', true],
    ['2*', true],
    ['(', true],
    ['√', true],
    ['2-', false],
    ['2.', false],
  ])('writes a minus after %j: %j', (expression, expected) => {
    expect(canAppendSymbol(expression, '-')).toBe(expected)
  })

  it.each([
    ['2', true],
    ['2.5+1', true],
    ['2.5', false],
    ['', false],
    ['2+', false],
    ['(2+3)', false],
  ])('writes a decimal point after %j: %j', (expression, expected) => {
    expect(canAppendSymbol(expression, '.')).toBe(expected)
  })

  it.each([
    ['10', true],
    ['(2+3)', true],
    ['', false],
    ['2+', false],
    ['10%', false],
    ['2.', false],
  ])('writes a percentage after %j: %j', (expression, expected) => {
    expect(canAppendSymbol(expression, '%')).toBe(expected)
  })

  it.each([
    ['', true],
    ['2+', true],
    ['(', true],
    ['√', true],
    ['9', false],
    ['(2+3)', false],
    ['10%', false],
  ])('writes a square root after %j: %j', (expression, expected) => {
    expect(canAppendSymbol(expression, '√')).toBe(expected)
  })

  it.each([
    ['', true],
    ['2*', true],
    ['√', true],
    // Nesting has to stay possible: ((2+3)*(4+5)) cannot be typed otherwise.
    ['(', true],
    ['2', false],
    ['(2+3)', false],
    ['10%', false],
  ])('opens a parenthesis after %j: %j', (expression, expected) => {
    expect(canAppendSymbol(expression, '(')).toBe(expected)
  })

  it.each([
    ['(2+3', true],
    ['((2+3)*4', true],
    ['(10%', true],
    ['', false],
    ['2+3', false],
    ['(', false],
    ['(2+', false],
    ['(2+3)', false],
  ])('closes a parenthesis after %j: %j', (expression, expected) => {
    expect(canAppendSymbol(expression, ')')).toBe(expected)
  })
})
