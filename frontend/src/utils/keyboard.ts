import { CALCULATOR_KEYS, type CalculatorKeyDefinition } from './constants'

const keysByKeyboardKey = new Map<string, CalculatorKeyDefinition>(
  CALCULATOR_KEYS.flatMap((key) =>
    key.keyboardKeys.map((keyboardKey) => [keyboardKey.toLowerCase(), key] as const),
  ),
)

/**
 * Translates a physical key press into the keypad key it stands for, or `undefined` when the
 * calculator has nothing to do with it. Presses carrying a control or command modifier are
 * ignored on purpose: they belong to the browser's own shortcuts, not to the calculator.
 */
export function findKeyBinding(event: KeyboardEvent): CalculatorKeyDefinition | undefined {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return undefined
  }

  return keysByKeyboardKey.get(event.key.toLowerCase())
}
