import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * The base URL is read once when the module loads, so each case re-imports it with a different
 * environment instead of calling a function twice.
 */
async function importHttpWith(configuredBaseUrl: string | undefined) {
  vi.resetModules()
  vi.stubEnv('VITE_API_BASE_URL', configuredBaseUrl)

  return import('./http')
}

function stubFetch() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  })
  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('the API base URL', () => {
  it('stays on the origin serving the app when nothing is configured', async () => {
    const fetchMock = stubFetch()
    const { postJson } = await importHttpWith(undefined)

    await postJson('/evaluate', { expression: '2+3' })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/evaluate', expect.anything())
  })

  it('points at the configured API when the two run on different origins', async () => {
    const fetchMock = stubFetch()
    const { postJson } = await importHttpWith('http://localhost:8080/api/v1')

    await postJson('/evaluate', { expression: '2+3' })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/evaluate',
      expect.anything(),
    )
  })
})
