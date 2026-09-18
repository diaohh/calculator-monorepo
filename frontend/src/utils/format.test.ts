import { describe, expect, it } from 'vitest'
import { formatResult } from './format'

describe('formatResult', () => {
  it.each([
    [20, '20'],
    [0, '0'],
    [-4, '-4'],
    [3.5, '3.5'],
    [1024, '1,024'],
    [0.30000000000000004, '0.3'],
  ])('formats %j as %j', (value, expected) => {
    expect(formatResult(value)).toBe(expected)
  })
})
