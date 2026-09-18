import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useKeyboard } from './useKeyboard'

function press(key: string, modifiers: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent('keydown', { key, cancelable: true, ...modifiers })
  window.dispatchEvent(event)

  return event
}

describe('useKeyboard', () => {
  it('reports the key a press stands for', () => {
    const onKeyPress = vi.fn()
    renderHook(() => useKeyboard(onKeyPress))

    press('7')

    expect(onKeyPress).toHaveBeenCalledWith(expect.objectContaining({ id: 'seven' }))
  })

  it('keeps the browser from acting on a key the calculator uses', () => {
    renderHook(() => useKeyboard(vi.fn()))

    expect(press('Backspace').defaultPrevented).toBe(true)
  })

  it('leaves a key it does not know alone', () => {
    const onKeyPress = vi.fn()
    renderHook(() => useKeyboard(onKeyPress))

    expect(press('a').defaultPrevented).toBe(false)
    expect(onKeyPress).not.toHaveBeenCalled()
  })

  it('stops listening once unmounted', () => {
    const onKeyPress = vi.fn()
    const { unmount } = renderHook(() => useKeyboard(onKeyPress))

    unmount()
    press('7')

    expect(onKeyPress).not.toHaveBeenCalled()
  })
})
