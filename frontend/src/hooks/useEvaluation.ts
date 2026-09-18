import { skipToken, useQuery } from '@tanstack/react-query'
import { evaluate } from '../services/calculator.service'
import { ApiRequestError } from '../services/http'
import { ERROR_MESSAGES } from '../utils/constants'
import { formatResult } from '../utils/format'

function toErrorMessage(error: Error): string {
  return error instanceof ApiRequestError
    ? ERROR_MESSAGES[error.code]
    : ERROR_MESSAGES.INTERNAL_ERROR
}

/**
 * Evaluates the submitted expression through the API.
 *
 * It is a query rather than a mutation because evaluating an expression is a pure read: the
 * same expression always yields the same result, so it never goes stale and asking twice can
 * be answered from the cache. `retry` is off because a 422 is the domain answering, not a
 * transient failure worth repeating.
 */
export function useEvaluation(submittedExpression: string | null) {
  const query = useQuery({
    queryKey: ['evaluate', submittedExpression],
    // `skipToken` keeps the query idle until something has been submitted, and does it
    // without widening the service signature to accept a null expression.
    queryFn: submittedExpression === null ? skipToken : () => evaluate(submittedExpression),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })

  return {
    result: query.data ? formatResult(query.data.result) : null,
    errorMessage: query.error ? toErrorMessage(query.error) : null,
    isLoading: query.isFetching,
  }
}
