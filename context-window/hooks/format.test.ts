import { expect, test } from 'claude-code/testing'

import type { Category } from '../types'
import { compact, pct, rows, split, waffle } from './format'

const cats: Category[] = [
  { name: 'System prompt', tokens: 4_000, color: 'promptBorder', kind: 'used' },
  { name: 'System tools', tokens: 35_000, color: 'inactive', kind: 'used' },
  { name: 'Messages', tokens: 50_000, color: 'permission', kind: 'used' },
  { name: 'MCP tools (deferred)', tokens: 196_000, color: 'subtle', kind: 'deferred' },
  { name: 'Autocompact buffer', tokens: 33_000, color: 'warning', kind: 'buffer' },
  { name: 'Free space', tokens: 878_000, color: 'inactive', kind: 'free' },
]

test('rows drop deferred, colour used rows distinctly, shares sum to 100', () => {
  const list = rows(cats)
  expect(list.some(r => r.kind === 'deferred')).toBe(false)
  const used = list.filter(r => r.kind === 'used').map(r => r.hex)
  expect(new Set(used).size).toBe(used.length)
  expect(Math.round(list.reduce((s, r) => s + r.share, 0))).toBe(100)
})

test('split fills the width exactly and keeps small rows visible', () => {
  for (const width of [20, 37, 640]) {
    const out = split([4, 35, 50, 33, 878], width, [true, true, true, false, false], 1)
    expect(out.reduce((s, n) => s + n, 0)).toBe(width)
    expect(out[0]! >= 1).toBe(true)
  }
})

test('labels', () => {
  expect(compact(113_303)).toBe('113k')
  expect(compact(1_000_000)).toBe('1M')
  expect(pct(5)).toBe('5.0%')
  expect(pct(85.4)).toBe('85%')
})

const width = (line: { text: string }[]) => line.reduce((s, x) => s + x.text.length, 0)

test('waffle keeps a fixed size, largest used first, the buffer last', () => {
  const w = waffle(rows(cats), 25, 20)
  expect(w.length).toBe(20)
  expect(w.every(l => width(l) === 25)).toBe(true)
  const list = rows(cats)
  const messages = list.find(r => r.name === 'Messages')!
  expect(w[0]![0]!.hex).toBe(messages.hex)
  expect(w[19]!.at(-1)!.text.at(-1)).toBe('▒')
})
