import { describe, expect, it } from 'vitest'
import { findKeyBinding } from './keyboard'

function keyDown(key: string, modifiers: Partial<KeyboardEventInit> = {}) {
  return new KeyboardEvent('keydown', { key, ...modifiers })
}

describe('findKeyBinding', () => {
  it('finds the key a digit stands for', () => {
    expect(findKeyBinding(keyDown('7'))?.id).toBe('seven')
  })

  it('finds an operator whose symbol differs from its label', () => {
    expect(findKeyBinding(keyDown('/'))?.id).toBe('division')
  })

  it('ignores the case of letter bindings', () => {
    expect(findKeyBinding(keyDown('R'))?.id).toBe('square-root')
  })

  it.each(['Enter', '='])('evaluates on %j', (key) => {
    expect(findKeyBinding(keyDown(key))?.id).toBe('equals')
  })

  it('answers nothing for a key outside the catalogue', () => {
    expect(findKeyBinding(keyDown('a'))).toBeUndefined()
  })

  it.each([{ ctrlKey: true }, { metaKey: true }, { altKey: true }])(
    'leaves %j to the browser',
    (modifiers) => {
      expect(findKeyBinding(keyDown('7', modifiers))).toBeUndefined()
    },
  )
})
