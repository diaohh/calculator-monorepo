import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('mounts the calculator with its providers', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Calculator' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Calculate the result' })).toBeInTheDocument()
  })
})
