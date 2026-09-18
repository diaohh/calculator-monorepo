import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiRequestError } from '../services/http'
import { TestProviders } from '../test/renderWithProviders'
import { useEvaluation } from './useEvaluation'

const evaluate = vi.hoisted(() => vi.fn())

vi.mock('../services/calculator.service', () => ({ evaluate }))

beforeEach(() => {
  evaluate.mockReset()
  evaluate.mockResolvedValue({ expression: '2+3', result: 5 })
})

function renderEvaluation(expression: string | null) {
  return renderHook(({ submitted }) => useEvaluation(submitted), {
    wrapper: TestProviders,
    initialProps: { submitted: expression },
  })
}

describe('useEvaluation', () => {
  it('asks for nothing until an expression is submitted', () => {
    const { result } = renderEvaluation(null)

    expect(evaluate).not.toHaveBeenCalled()
    expect(result.current.result).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('answers the formatted result', async () => {
    evaluate.mockResolvedValue({ expression: '2^10', result: 1024 })

    const { result } = renderEvaluation('2^10')

    await waitFor(() => expect(result.current.result).toBe('1,024'))
    expect(result.current.errorMessage).toBeNull()
  })

  it('translates a domain error into a readable message', async () => {
    evaluate.mockRejectedValue(new ApiRequestError('DIVISION_BY_ZERO', 'the API answered with 422'))

    const { result } = renderEvaluation('10/0')

    await waitFor(() => expect(result.current.errorMessage).toBe('Cannot divide by zero.'))
    expect(result.current.result).toBeNull()
  })

  it('reports an unexpected failure as a generic message', async () => {
    evaluate.mockRejectedValue(new Error('boom'))

    const { result } = renderEvaluation('2+3')

    await waitFor(() =>
      expect(result.current.errorMessage).toBe('Something went wrong. Please try again.'),
    )
  })

  it('answers an expression it already evaluated from the cache', async () => {
    const { result, rerender } = renderEvaluation('2+3')

    await waitFor(() => expect(result.current.result).toBe('5'))

    rerender({ submitted: null })
    rerender({ submitted: '2+3' })

    await waitFor(() => expect(result.current.result).toBe('5'))
    expect(evaluate).toHaveBeenCalledTimes(1)
  })
})
