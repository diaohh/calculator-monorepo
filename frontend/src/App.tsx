import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Calculator } from './components/calculator/Calculator'

const queryClient = new QueryClient()

function App() {
  return (
    <MantineProvider forceColorScheme="dark">
      <QueryClientProvider client={queryClient}>
        <main className="grid min-h-dvh place-items-center bg-shell p-4">
          <div className="w-full max-w-sm">
            <h1 className="sr-only">Calculator</h1>
            <Calculator />
            <p className="mt-4 hidden text-center text-sm text-muted sm:block">
              Use the keypad or type with your keyboard
            </p>
          </div>
        </main>
      </QueryClientProvider>
    </MantineProvider>
  )
}

export default App
