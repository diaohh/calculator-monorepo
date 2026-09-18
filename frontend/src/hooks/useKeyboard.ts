import { useEffect } from 'react'
import type { CalculatorKeyDefinition } from '../utils/constants'
import { findKeyBinding } from '../utils/keyboard'

/**
 * Lets the physical keyboard drive the same handler the keypad uses. Subscribing to the
 * document is the one thing in this app that genuinely reaches outside React, which is why it
 * is the only effect here.
 */
export function useKeyboard(onKeyPress: (key: CalculatorKeyDefinition) => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = findKeyBinding(event)
      if (!key) {
        return
      }

      // Several of the bound keys mean something to the browser as well: Backspace can
      // navigate back and "/" opens quick find.
      event.preventDefault()
      onKeyPress(key)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onKeyPress])
}
