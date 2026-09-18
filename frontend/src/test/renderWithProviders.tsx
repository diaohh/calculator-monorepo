import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

/**
 * A fresh client per test: sharing one would let a cached result leak into the next test and
 * hide a request that should have happened. Retries are off so an error surfaces immediately.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

export function TestProviders({ children }: { children: ReactNode }) {
  return (
    <MantineProvider env="test">
      <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
    </MantineProvider>
  )
}

export function renderWithProviders(ui: ReactElement) {
  return render(ui, { wrapper: TestProviders })
}
