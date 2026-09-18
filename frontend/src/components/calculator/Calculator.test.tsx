import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiRequestError } from '../../services/http'
import { renderWithProviders } from '../../test/renderWithProviders'
import { Calculator } from './Calculator'

const evaluate = vi.hoisted(() => vi.fn())

vi.mock('../../services/calculator.service', () => ({ evaluate }))

beforeEach(() => {
  evaluate.mockReset()
  evaluate.mockResolvedValue({ expression: '2+3', result: 5 })
})

function expressionLine() {
  return screen.getByLabelText('Expression')
}

// Asserting on the result region rather than on the text itself: a digit shown on screen is
// just as likely to be a key on the keypad.
function resultLine() {
  return screen.getByLabelText('Result')
}

async function pressKeys(names: string[]) {
  const user = userEvent.setup()

  for (const name of names) {
    await user.click(screen.getByRole('button', { name }))
  }
}

describe('Calculator', () => {
  it('shows a zero while nothing has been written', () => {
    renderWithProviders(<Calculator />)

    expect(expressionLine()).toHaveTextContent('0')
  })

  it('writes what the user presses on the keypad', async () => {
    renderWithProviders(<Calculator />)

    await pressKeys(['Two', 'Add', 'Three'])

    expect(expressionLine()).toHaveTextContent('2+3')
  })

  it('keeps the result hidden until the user asks for it', async () => {
    renderWithProviders(<Calculator />)

    await pressKeys(['Two', 'Add', 'Three'])

    expect(evaluate).not.toHaveBeenCalled()
  })

  it('shows the result once the user presses equals', async () => {
    renderWithProviders(<Calculator />)

    await pressKeys(['Two', 'Add', 'Three', 'Calculate the result'])

    await waitFor(() => expect(resultLine()).toHaveTextContent('5'))
    expect(evaluate).toHaveBeenCalledWith('2+3')
  })

  it('deletes the last symbol and clears everything', async () => {
    renderWithProviders(<Calculator />)

    await pressKeys(['Two', 'Add', 'Delete last symbol'])
    expect(expressionLine()).toHaveTextContent('2')

    await pressKeys(['Clear all'])
    expect(expressionLine()).toHaveTextContent('0')
  })

  it('ignores a key that cannot follow what is written', async () => {
    renderWithProviders(<Calculator />)

    await pressKeys(['Two', 'Multiply', 'Multiply'])

    expect(expressionLine()).toHaveTextContent('2*')
  })

  it('writes with the physical keyboard too', async () => {
    renderWithProviders(<Calculator />)

    await userEvent.keyboard('9*9')

    expect(expressionLine()).toHaveTextContent('9*9')
  })

  it('tells the user what the backend rejected', async () => {
    evaluate.mockRejectedValue(new ApiRequestError('DIVISION_BY_ZERO', 'the API answered with 422'))

    renderWithProviders(<Calculator />)
    await pressKeys(['One', 'Zero', 'Divide', 'Zero', 'Calculate the result'])

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot divide by zero.')
  })

  it('drops the result as soon as the user writes again', async () => {
    renderWithProviders(<Calculator />)

    await pressKeys(['Two', 'Add', 'Three', 'Calculate the result'])
    await waitFor(() => expect(resultLine()).toHaveTextContent('5'))

    await pressKeys(['One'])

    expect(resultLine()).toBeEmptyDOMElement()
  })
})
