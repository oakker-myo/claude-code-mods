import { expect, test } from 'claude-code/testing'

import { crossed, elapsed, meter, pace, runs, until } from './format'

const now = Date.parse('2026-10-08T10:00:00Z')

test('reset countdown', () => {
  expect(until('2026-10-08T10:04:00Z', now)).toBe('4m')
  expect(until('2026-10-08T12:10:00Z', now)).toBe('2h 10m')
  expect(until('2026-10-10T01:00:00Z', now)).toBe('1d 15h')
})

test('elapsed share of the window', () => {
  // 5-hour window resetting in 1 hour: 80% elapsed
  expect(elapsed({ kind: 'five_hour', percentUsed: 10, resetsAt: '2026-10-08T11:00:00Z' }, now)).toBe(80)
  expect(elapsed({ kind: 'spend_limit', percentUsed: 10 }, now)).toBe(undefined)
})

test('meter fills and places the pace tick', () => {
  const cells = meter(50, 10, 80)
  expect(cells.map(c => c.glyph).join('')).toBe('█████░░░│░')
  expect(runs(cells).map(r => r.kind)).toEqual(['fill', 'empty', 'pace', 'empty'])
})

test('pace verdict', () => {
  expect(pace(23, 98)).toBe('behind')
  expect(pace(60, 40)).toBe('ahead')
  expect(pace(50, 52)).toBe('on pace')
})

test('threshold crossing', () => {
  expect(crossed(70, 82, [80, 95])).toBe(80)
  expect(crossed(82, 85, [80, 95])).toBe(undefined)
})

