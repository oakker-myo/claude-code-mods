import type { Limit } from '../types'

const HOUR = 3_600_000

const WINDOWS: Record<string, { label: string; short: string; ms?: number }> = {
  five_hour: { label: '5-hour', short: '5h', ms: 5 * HOUR },
  seven_day: { label: 'Weekly', short: 'wk', ms: 7 * 24 * HOUR },
  spend_limit: { label: 'Spend', short: 'spend' },
}

export function label(kind: string): string {
  return WINDOWS[kind]?.label ?? kind
}

export function short(kind: string): string {
  return WINDOWS[kind]?.short ?? kind
}

export function tone(percent: number): 'success' | 'warning' | 'error' {
  return percent >= 90 ? 'error' : percent >= 70 ? 'warning' : 'success'
}

export function until(resetsAt: string | undefined, now: number): string {
  if (!resetsAt) return ''
  const ms = Date.parse(resetsAt) - now
  if (!Number.isFinite(ms) || ms <= 0) return 'now'
  const mins = Math.round(ms / 60_000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${String(mins % 60).padStart(2, '0')}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

/** How far through its window a limit is, 0 to 100, or undefined when unknown. */
export function elapsed(l: Limit, now: number): number | undefined {
  const ms = WINDOWS[l.kind]?.ms
  if (!ms || !l.resetsAt) return undefined
  const left = Date.parse(l.resetsAt) - now
  if (!Number.isFinite(left)) return undefined
  return Math.max(0, Math.min(100, 100 - (left / ms) * 100))
}

export type Cell = { glyph: string; kind: 'fill' | 'empty' | 'pace' }

/** The meter's cells: filled to `percent`, with a pace tick at `pace` when known. */
export function meter(percent: number, width: number, pace?: number): Cell[] {
  const filled = Math.max(0, Math.min(width, Math.round((percent / 100) * width)))
  const tick = pace === undefined ? -1 : Math.min(width - 1, Math.floor((pace / 100) * width))
  return Array.from({ length: width }, (_, i): Cell =>
    i === tick ? { glyph: '│', kind: 'pace' } : i < filled ? { glyph: '█', kind: 'fill' } : { glyph: '░', kind: 'empty' },
  )
}

/** Runs of equal-kind cells, so a meter draws as a few Text spans. */
export function runs(cells: Cell[]): { kind: Cell['kind']; text: string }[] {
  const out: { kind: Cell['kind']; text: string }[] = []
  for (const c of cells) {
    const last = out[out.length - 1]
    if (last && last.kind === c.kind) last.text += c.glyph
    else out.push({ kind: c.kind, text: c.glyph })
  }
  return out
}

export function pace(percent: number, elapsedPct: number | undefined): 'ahead' | 'behind' | 'on pace' | undefined {
  if (elapsedPct === undefined) return undefined
  const diff = percent - elapsedPct
  return diff > 5 ? 'ahead' : diff < -5 ? 'behind' : 'on pace'
}

export function crossed(
  before: number | undefined,
  after: number | undefined,
  marks: number[],
): number | undefined {
  if (after === undefined) return undefined
  return [...marks].sort((a, b) => b - a).find(m => after >= m && (before ?? 0) < m)
}

export const TONE_HEX: Record<ReturnType<typeof tone>, string> = {
  success: '#3fb37f',
  warning: '#e0a43a',
  error: '#e5534b',
}
export const TRACK = '#8b949e'

