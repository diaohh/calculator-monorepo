import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { evaluate } from './calculator.service'
import { ApiRequestError } from './http'

function respondWith(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', respondWith(200, { expression: '2+3', result: 5 }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('evaluate', () => {
  it('posts the expression as the contract describes', async () => {
    await evaluate('2+3')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/evaluate'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: '2+3' }),
      }),
    )
  })

  it('answers the parsed result', async () => {
    await expect(evaluate('2+3')).resolves.toEqual({ expression: '2+3', result: 5 })
  })

  it.each([
    [400, 'INVALID_CHARACTERS'],
    [422, 'DIVISION_BY_ZERO'],
    [500, 'INTERNAL_ERROR'],
  ])('turns a %i into its contract code', async (status, code) => {
    vi.stubGlobal('fetch', respondWith(status, { code, message: 'whatever' }))

    await expect(evaluate('10/0')).rejects.toMatchObject({ name: 'ApiRequestError', code })
  })

  it('reports an unexpected error when the failure carries no contract body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error('not json')),
      }),
    )

    await expect(evaluate('2+3')).rejects.toMatchObject({ code: 'INTERNAL_ERROR' })
  })

  it('reports an unexpected error when the API cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const failure = await evaluate('2+3').catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(ApiRequestError)
    expect(failure).toMatchObject({ code: 'INTERNAL_ERROR' })
  })
})
