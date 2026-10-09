import type { Receipt, Tokens } from '../types'

export type Category = { key: keyof Tokens; name: string; hex: string }

/** Token categories in drawing order, in colours that read on light and dark. */
export const CATEGORIES: Category[] = [
  { key: 'cacheRead', name: 'Cache read', hex: '#3fb3a8' },
  { key: 'cacheWrite', name: 'Cache write', hex: '#b77ee0' },
  { key: 'input', name: 'Input', hex: '#6c8cf5' },
  { key: 'output', name: 'Output', hex: '#d97757' },
  { key: 'subagents', name: 'Subagents', hex: '#e06c8a' },
]

export const emptyTokens = (): Tokens => ({ input: 0, cacheRead: 0, cacheWrite: 0, output: 0, subagents: 0 })

export function total(t: Tokens): number {
  return t.input + t.cacheRead + t.cacheWrite + t.output + t.subagents
}

export function compact(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${Math.round(n / 1_000)}k`
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}k`
  return String(n)
}

export function usd(n: number | undefined): string {
  if (n === undefined) return '—'
  if (n === 0) return '$0.00'
  if (n < 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(n < 1 ? 3 : 2)}`
}

export function duration(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${String(s % 60).padStart(2, '0')}s`
}

export function pct(part: number, whole: number): string {
  if (whole === 0) return '0%'
  const p = (part / whole) * 100
  return p >= 10 ? `${Math.round(p)}%` : p >= 0.1 ? `${p.toFixed(1)}%` : '<0.1%'
}

/** Cells per non-empty category for a `width`-cell bar; every non-empty one gets at least one. */
export function cells(t: Tokens, width: number): { category: Category; cells: number }[] {
  const rows = CATEGORIES.filter(c => t[c.key] > 0)
  const sum = rows.reduce((s, c) => s + t[c.key], 0)
  if (sum === 0 || width <= 0) return []

  const exact = rows.map(c => (t[c.key] / sum) * width)
  const out = exact.map(x => Math.max(1, Math.floor(x)))
  let left = width - out.reduce((s, n) => s + n, 0)
  const order = exact.map((x, i) => ({ i, rem: x - Math.floor(x) })).sort((a, b) => b.rem - a.rem)
  for (let k = 0; left > 0 && k < order.length; k++, left--) out[order[k]!.i]! += 1
  while (left < 0) {
    const big = out.indexOf(Math.max(...out))
    out[big]! -= 1
    left += 1
  }
  return rows.map((category, i) => ({ category, cells: out[i]! }))
}

/** `Bash ×3 · Read ×2 · Edit`, busiest first. */
export function toolList(tools: Record<string, number>): string {
  return Object.entries(tools)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, n]) => (n > 1 ? `${name} ×${n}` : name))
    .join(' · ')
}

/** Rough tokens per image block; the API sizes images by pixels, which a row does not carry. */
const IMAGE_TOKENS = 1_500

/**
 * Estimated tokens of one tool_result's content (a string or content blocks),
 * at about four characters a token: the API does not count rows separately.
 */
export function estimate(content: unknown): number {
  if (typeof content === 'string') return Math.ceil(content.length / 4)
  if (!Array.isArray(content)) return 0
  return content.reduce((sum: number, b: unknown) => {
    const block = b as { type?: string; text?: unknown }
    if (block.type === 'text' && typeof block.text === 'string') return sum + Math.ceil(block.text.length / 4)
    if (block.type === 'image') return sum + IMAGE_TOKENS
    return sum + Math.ceil(JSON.stringify(b).length / 4)
  }, 0)
}

/** Claude's own bookkeeping: always folded into the "+ more" line, never a row of its own. */
export const BOOKKEEPING = new Set(['ToolSearch', 'ExitPlanMode', 'EnterPlanMode', 'TodoWrite', 'TaskStop'])

export type ToolRow = { name: string; calls: number; tokens: number }

export type ToolTable = {
  rows: ToolRow[]
  /** Everything past the top rows, and all bookkeeping tools, folded into one line. */
  more: { names: string[]; calls: number; tokens: number } | null
  calls: number
  tokens: number
}

/** The tools as table rows: the `top` busiest by output (then calls) and one folded "more" line. */
export function toolTable(tools: Record<string, number>, output: Record<string, number>, top = 4): ToolTable {
  const names = new Set([...Object.keys(tools), ...Object.keys(output)])
  const all: ToolRow[] = [...names].map(name => ({ name, calls: tools[name] ?? 0, tokens: output[name] ?? 0 }))
  all.sort((a, b) => b.tokens - a.tokens || b.calls - a.calls || a.name.localeCompare(b.name))

  const rows = all.filter(r => !BOOKKEEPING.has(r.name)).slice(0, top)
  const rest = all.filter(r => !rows.includes(r))
  const sum = (list: ToolRow[], k: 'calls' | 'tokens') => list.reduce((s, r) => s + r[k], 0)

  return {
    rows,
    more: rest.length ? { names: rest.map(r => r.name), calls: sum(rest, 'calls'), tokens: sum(rest, 'tokens') } : null,
    calls: sum(all, 'calls'),
    tokens: sum(all, 'tokens'),
  }
}

/** Small turns draw the tools as one line instead of a table. */
export function isCompact(t: ToolTable): boolean {
  return t.calls < 3 && t.tokens < 1_000
}

const EIGHTHS = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉']

/** A bar of up to `width` cells for `value` against `max`, in eighth-cell steps. */
export function miniBar(value: number, max: number, width = 10): string {
  if (max <= 0 || value <= 0) return ''
  const eighths = Math.max(1, Math.round((value / max) * width * 8))
  return '█'.repeat(Math.floor(eighths / 8)) + EIGHTHS[eighths % 8]
}

const TAIL = 120

export function tail(text: string): string {
  return text.trim().slice(-TAIL)
}

/** The receipt belonging to an assistant row: by its id, else by its text's ending. */
export function find(receipts: Receipt[], requestId: string | undefined, text: string): Receipt | undefined {
  const byId = requestId === undefined ? undefined : receipts.find(r => r.uuid === requestId)
  if (byId) return byId
  const end = tail(text)
  if (end.length < 8) return undefined
  return receipts.find(r => r.answerTail.length >= 8 && (end.endsWith(r.answerTail) || r.answerTail.endsWith(end)))
}

export function shortModel(model: string | undefined): string | undefined {
  return model?.replace(/^claude-/, '').replace(/-\d{8}$/, '')
}
