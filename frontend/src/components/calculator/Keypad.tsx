import { CALCULATOR_KEYS, type CalculatorKeyDefinition } from '../../utils/constants'
import { CalculatorKey } from './CalculatorKey'

type KeypadProps = {
  onKeyPress: (key: CalculatorKeyDefinition) => void
}

export function Keypad({ onKeyPress }: KeypadProps) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {CALCULATOR_KEYS.map((definition) => (
        <CalculatorKey key={definition.id} definition={definition} onPress={onKeyPress} />
      ))}
    </div>
  )
}
