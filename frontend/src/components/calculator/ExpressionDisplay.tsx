import { Loader } from '@mantine/core'

const expressionLineClasses =
  'overflow-x-auto text-right text-xl tabular-nums text-slate-200 [scrollbar-width:none] sm:text-2xl [&::-webkit-scrollbar]:hidden'

const resultLineClasses =
  'mt-3 flex min-h-10 items-center justify-end text-4xl font-semibold tabular-nums text-white sm:min-h-12 sm:text-5xl'

type ExpressionDisplayProps = {
  expression: string
  result: string | null
  isLoading: boolean
}

export function ExpressionDisplay({ expression, result, isLoading }: ExpressionDisplayProps) {
  return (
    <div className="rounded-2xl bg-display px-4 py-5 sm:px-5">
      {/* The line scrolls right to left so that a long expression keeps its tail — the part
          being typed — in view, without any scroll handling in JavaScript. */}
      <div dir="rtl" role="group" aria-label="Expression" className={expressionLineClasses}>
        <span dir="ltr" className="inline-block whitespace-nowrap">
          {expression || '0'}
        </span>
      </div>

      {/* `output` is the element for a calculated value, and its implicit `status` role makes
          the result a polite live region without declaring one. */}
      <output aria-label="Result" className={resultLineClasses}>
        {isLoading ? <Loader size="sm" color="blue" /> : result}
      </output>
    </div>
  )
}
