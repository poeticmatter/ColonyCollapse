/** Small helpers for summarising simulated games as plain-text tables. */

export function mean(values: readonly number[]): number {
  return values.length === 0 ? NaN : values.reduce((total, value) => total + value, 0) / values.length
}

export function percent(part: number, whole: number): string {
  return whole === 0 ? '-' : `${((100 * part) / whole).toFixed(1)}%`
}

/** A 95% interval half-width for a proportion, in percentage points: how much to trust a win rate. */
export function marginOfError(part: number, whole: number): string {
  if (whole === 0) return '-'
  const rate = part / whole
  return `±${(196 * Math.sqrt((rate * (1 - rate)) / whole)).toFixed(1)}`
}

export function fixed(value: number, digits = 1): string {
  return Number.isNaN(value) ? '-' : value.toFixed(digits)
}

export function table(headers: string[], rows: (string | number)[][]): string {
  const cells = [headers, ...rows.map((row) => row.map(String))]
  const widths = headers.map((_, column) => Math.max(...cells.map((row) => row[column].length)))
  const line = (row: string[]) => `| ${row.map((cell, column) => cell.padEnd(widths[column])).join(' | ')} |`
  return [line(cells[0]), `|${widths.map((width) => '-'.repeat(width + 2)).join('|')}|`, ...cells.slice(1).map(line)].join('\n')
}

export function heading(title: string): void {
  console.log(`\n## ${title}\n`)
}
