import type { EvaluateRequest, EvaluateResponse } from '../types/api'
import { postJson } from './http'

const EVALUATE_PATH = '/evaluate'

export function evaluate(expression: string): Promise<EvaluateResponse> {
  const request: EvaluateRequest = { expression }

  return postJson<EvaluateResponse>(EVALUATE_PATH, request)
}
