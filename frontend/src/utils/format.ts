/**
 * Ten decimals because that is what the API rounds to (docs/API.md), and thousands separators
 * because that is what a calculator display does.
 */
const resultFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 10 })

export function formatResult(value: number): string {
  return resultFormatter.format(value)
}
