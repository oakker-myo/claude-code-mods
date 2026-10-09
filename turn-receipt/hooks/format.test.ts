import { expect, test } from 'claude-code/testing'

import type { Receipt } from '../types'
import { cells, compact, duration, emptyTokens, estimate, find, isCompact, miniBar, shortModel, toolList, toolTable, usd } from './format'

const receipt = (over: Partial<Receipt>): Receipt => ({
  turnId: 't1',
  answerTail: 'and that is the whole answer.',
  durationMs: 1000,
  tokens: emptyTokens(),
  tools: {},
  isAborted: false,
  ...over,
})

test('money and sizes', () => {
  expect(usd(0.0042)).toBe('$0.0042')
  expect(usd(0.042)).toBe('$0.042')
  expect(usd(1.5)).toBe('$1.50')
  expect(usd(undefined)).toBe('—')
  expect(compact(1_234)).toBe('1.2k')
  expect(compact(38_200)).toBe('38k')
  expect(duration(74_000)).toBe('1m 14s')
})

test('bar cells fill the width and keep small categories', () => {
  const t = { ...emptyTokens(), cacheRead: 30_000, cacheWrite: 4_000, input: 12, output: 900 }
  const out = cells(t, 40)
  expect(out.reduce((s, c) => s + c.cells, 0)).toBe(40)
  expect(out.every(c => c.cells >= 1)).toBe(true)
  expect(out.map(c => c.category.key)).toEqual(['cacheRead', 'cacheWrite', 'input', 'output'])
})

test('tool list, busiest first', () => {
  expect(toolList({ Read: 2, Edit: 1, Bash: 3 })).toBe('Bash ×3 · Read ×2 · Edit')
  expect(toolList({})).toBe('')
})

test('find matches by id, else by the answer ending', () => {
  const list = [receipt({ uuid: 'abc' }), receipt({ turnId: 't2', answerTail: 'a different reply entirely' })]
  expect(find(list, 'abc', 'whatever')?.turnId).toBe('t1')
  expect(find(list, 'zzz', 'Some text. A different reply entirely'.toLowerCase())?.turnId).toBe('t2')
  expect(find(list, 'zzz', 'no match here at all')).toBe(undefined)
})

test('model names shortened', () => {
  expect(shortModel('claude-opus-5-5')).toBe('opus-5-5')
  expect(shortModel('claude-sonnet-4-5-20250929')).toBe('sonnet-4-5')
})

test('tool output estimate', () => {
  expect(estimate('x'.repeat(400))).toBe(100)
  expect(estimate([{ type: 'text', text: 'x'.repeat(40) }, { type: 'image', source: {} }])).toBe(1_510)
  expect(estimate(undefined)).toBe(0)
})

test('tool table: top four by output, bookkeeping folded, totals', () => {
  const t = toolTable(
    { Bash: 3, Read: 2, Edit: 2, Write: 1, Grep: 1, ExitPlanMode: 1, ToolSearch: 1 },
    { Bash: 182, Read: 261, Edit: 46, Write: 37, Grep: 20, ExitPlanMode: 444, ToolSearch: 13 },
  )
  expect(t.rows.map(r => r.name)).toEqual(['Read', 'Bash', 'Edit', 'Write'])
  expect(t.more?.names.sort()).toEqual(['ExitPlanMode', 'Grep', 'ToolSearch'])
  expect(t.more?.calls).toBe(3)
  expect(t.calls).toBe(11)
  expect(t.tokens).toBe(1_003)
  expect(isCompact(t)).toBe(false)
})

test('small turns are compact', () => {
  expect(isCompact(toolTable({ Bash: 2 }, { Bash: 180 }))).toBe(true)
  expect(isCompact(toolTable({ Read: 1 }, { Read: 4_000 }))).toBe(false)
  expect(toolTable({}, {}).more).toBe(null)
})

test('mini bar uses whole blocks, at least one', () => {
  expect(miniBar(10, 10)).toBe('██████████')
  expect(miniBar(5, 10)).toBe('█████')
  expect(miniBar(1, 1_000)).toBe('█')
  expect(miniBar(26, 100)).toBe('███')
  expect(miniBar(0, 10)).toBe('')
})
