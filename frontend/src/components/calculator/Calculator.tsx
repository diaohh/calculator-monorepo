import { Paper } from '@mantine/core'
import { useCalculator } from '../../hooks/useCalculator'
import { useEvaluation } from '../../hooks/useEvaluation'
import { useKeyboard } from '../../hooks/useKeyboard'
import { type CalculatorKeyDefinition } from '../../utils/constants'
import { ErrorMessage } from '../common/ErrorMessage'
import { ExpressionDisplay } from './ExpressionDisplay'
import { Keypad } from './Keypad'

const bodyClasses =
  'w-full rounded-3xl border border-line bg-surface p-4 shadow-2xl shadow-black/40 sm:p-5'

export function Calculator() {
  const { expression, submittedExpression, append, backspace, clear, submit } = useCalculator()
  const { result, errorMessage, isLoading } = useEvaluation(submittedExpression)

  // The keypad and the physical keyboard end up in the same handler, so a key behaves
  // identically however it was pressed.
  function handleKeyPress(key: CalculatorKeyDefinition) {
    switch (key.action) {
      case 'append':
        append(key.symbol)
        break
      case 'backspace':
        backspace()
        break
      case 'clear':
        clear()
        break
      case 'evaluate':
        submit()
        break
    }
  }

  useKeyboard(handleKeyPress)

  return (
    <Paper className={bodyClasses}>
      <ExpressionDisplay expression={expression} result={result} isLoading={isLoading} />

      {errorMessage && (
        <div className="mt-3">
          <ErrorMessage message={errorMessage} />
        </div>
      )}

      <div className="mt-4 sm:mt-5">
        <Keypad onKeyPress={handleKeyPress} />
      </div>
    </Paper>
  )
}
