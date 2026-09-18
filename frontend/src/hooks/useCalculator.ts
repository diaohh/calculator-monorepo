import { useState } from 'react'
import { appendSymbol, isEmpty, removeLastSymbol } from '../utils/expression'

/**
 * Owns the calculator state: what the user is writing and what they last asked to evaluate.
 * Editing the expression drops the submitted one, so the result disappears by derivation
 * instead of through an effect. This is the seam where the API call will be plugged in.
 */
export function useCalculator() {
  const [expression, setExpression] = useState('')
  const [submittedExpression, setSubmittedExpression] = useState<string | null>(null)

  function append(symbol: string) {
    setExpression((current) => appendSymbol(current, symbol))
    setSubmittedExpression(null)
  }

  function backspace() {
    setExpression(removeLastSymbol)
    setSubmittedExpression(null)
  }

  function clear() {
    setExpression('')
    setSubmittedExpression(null)
  }

  function submit() {
    if (isEmpty(expression)) {
      return
    }

    setSubmittedExpression(expression)
  }

  return { expression, submittedExpression, append, backspace, clear, submit }
}
