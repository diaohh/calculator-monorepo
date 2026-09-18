import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useCalculator } from './useCalculator'

describe('useCalculator', () => {
  it('starts empty, with nothing submitted', () => {
    const { result } = renderHook(() => useCalculator())

    expect(result.current.expression).toBe('')
    expect(result.current.submittedExpression).toBeNull()
  })

  it('writes the symbols in the order they are pressed', () => {
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.append('2')
      result.current.append('+')
      result.current.append('3')
    })

    expect(result.current.expression).toBe('2+3')
  })

  it('removes the last symbol', () => {
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.append('2')
      result.current.append('+')
    })
    act(() => result.current.backspace())

    expect(result.current.expression).toBe('2')
  })

  it('clears the expression', () => {
    const { result } = renderHook(() => useCalculator())

    act(() => result.current.append('2'))
    act(() => result.current.clear())

    expect(result.current.expression).toBe('')
  })

  it('submits the expression the user wrote', () => {
    const { result } = renderHook(() => useCalculator())

    act(() => result.current.append('2'))
    act(() => result.current.submit())

    expect(result.current.submittedExpression).toBe('2')
  })

  it('ignores a submission with nothing written', () => {
    const { result } = renderHook(() => useCalculator())

    act(() => result.current.submit())

    expect(result.current.submittedExpression).toBeNull()
  })

  it.each([
    ['writing', (calculator: ReturnType<typeof useCalculator>) => calculator.append('5')],
    ['deleting', (calculator: ReturnType<typeof useCalculator>) => calculator.backspace()],
    ['clearing', (calculator: ReturnType<typeof useCalculator>) => calculator.clear()],
  ])('drops the submitted expression when %s', (_action, edit) => {
    const { result } = renderHook(() => useCalculator())

    act(() => result.current.append('2'))
    act(() => result.current.submit())
    act(() => edit(result.current))

    expect(result.current.submittedExpression).toBeNull()
  })
})
