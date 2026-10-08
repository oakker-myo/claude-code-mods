import type { Category } from '../types'

/** Mid-tone categorical colours that read on light and dark backgrounds alike. */
export const PALETTE = ['#d97757', '#6c8cf5', '#3fb3a8', '#b77ee0', '#9b7653', '#5fae5f', '#e06c8a', '#4aa3df']
export const TRACK = '#8b949e'
export const BUFFER = '#e0a43a'

export const GLYPH: Record<Category['kind'], string> = {
  used: '█',
  buffer: '▒',
  free: '░',
  deferred: '·',
}

export type Row = Category & { hex: string; share: number }

/** The in-window rows in drawing order, each with its colour and share of the window. */
export function rows(categories: Category[]): Row[] {
  const inWindow = categories.filter(c => c.kind !== 'deferred' && c.tokens > 0)
  const total = inWindow.reduce((s, c) => s + c.tokens, 0) || 1
  let used = 0
  return inWindow.map(c => ({
    ...c,
    hex: c.kind === 'used' ? PALETTE[used++ % PALETTE.length]! : c.kind === 'buffer' ? BUFFER : TRACK,
    share: (c.tokens / total) * 100,
  }))
}

export function compact(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(n)
}

export function pct(share: number): string {
  return share >= 10 ? `${Math.round(share)}%` : share >= 0.1 ? `${share.toFixed(1)}%` : '<0.1%'
}

export function tone(percent: number): 'success' | 'warning' | 'error' {
  return percent >= 90 ? 'error' : percent >= 70 ? 'warning' : 'success'
}

/**
 * Splits `width` units across `sizes` in proportion (largest remainder),
 * giving each index in `atLeast` a floor of `min` so small rows stay visible.
 */
export function split(sizes: number[], width: number, atLeast: boolean[], min = 1): number[] {
  const total = sizes.reduce((s, n) => s + n, 0)
  if (total === 0 || width <= 0) return sizes.map(() => 0)

  const exact = sizes.map(n => (n / total) * width)
  const out = exact.map((x, i) => Math.max(atLeast[i] ? min : 0, Math.floor(x)))
  let left = width - out.reduce((s, n) => s + n, 0)

  const order = exact.map((x, i) => ({ i, rem: x - Math.floor(x) })).sort((a, b) => b.rem - a.rem)
  for (let k = 0; left > 0 && k < order.length; k++, left--) out[order[k]!.i]! += 1

  while (left < 0) {
    const big = out.indexOf(Math.max(...out))
    out[big]! -= 1
    left += 1
  }
  return out
}

export function crossed(
  before: number | undefined,
  after: number | undefined,
  marks: number[],
): number | undefined {
  if (after === undefined) return undefined
  return [...marks].sort((a, b) => b - a).find(m => after >= m && (before ?? 0) < m)
}
