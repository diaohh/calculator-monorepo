import { Button } from '@mantine/core'
import type { CalculatorKeyDefinition, CalculatorKeyVariant } from '../../utils/constants'

const baseClasses =
  'h-14 w-full rounded-2xl p-0 text-xl font-medium transition-colors duration-150 active:scale-95 sm:h-16 sm:text-2xl'

const variantClasses: Record<CalculatorKeyVariant, string> = {
  digit: 'bg-key text-slate-50 hover:bg-key-hover',
  operator: 'bg-key text-accent-soft hover:bg-key-hover',
  command: 'bg-command text-slate-100 hover:bg-command-hover',
  equals: 'bg-accent text-white hover:bg-accent-hover',
}

type CalculatorKeyProps = {
  definition: CalculatorKeyDefinition
  onPress: (key: CalculatorKeyDefinition) => void
}

export function CalculatorKey({ definition, onPress }: CalculatorKeyProps) {
  const layoutClasses = definition.wide ? 'col-span-2' : ''

  return (
    <Button
      aria-label={definition.ariaLabel}
      onClick={() => onPress(definition)}
      className={`${baseClasses} ${variantClasses[definition.variant]} ${layoutClasses}`}
    >
      {definition.label}
    </Button>
  )
}
