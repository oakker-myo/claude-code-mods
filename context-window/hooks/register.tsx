import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Category, Snapshot } from '../types'
import { GLYPH, compact, crossed, pct, rows, split, tone } from './format'

const PANE = 'context-window'
const snapshot = atom({ plugin: 'context-window', key: 'snapshot' } as const, null)
const paneOpen = atom({ plugin: 'context-window', key: 'paneOpen' } as const, false)

const MARKS = [50]
const ORDER: Record<Category['kind'], number> = { used: 0, buffer: 1, free: 2, deferred: 3 }

function title(snap: Snapshot | null): string {
  return snap?.percent === undefined ? 'Context window' : `Context window · ${snap.percent}%`
}

// The engine's pane list can miss a pane a remote surface (the desktop app)
// is showing, so the mod keeps its own record: set on open, cleared by ui.close.
async function isOpen($: EngineInterface): Promise<boolean> {
  return (await read($, paneOpen)) || (await $.ui.panes()).some(p => p.id === PANE)
}

async function openPane($: EngineInterface, snap: Snapshot | null): Promise<void> {
  await update($, paneOpen, () => true)
  await $.ui.open({ id: PANE, title: title(snap) })
}

async function measure($: EngineInterface): Promise<Snapshot> {
  const usage = await $.session.usage({ breakdown: 'summary' })
  const categories = (usage.context.breakdown?.categories ?? [])
    .map(c => ({ name: c.name, tokens: c.tokens, color: c.color, kind: c.kind }))
    .sort((a, b) => ORDER[a.kind] - ORDER[b.kind])
  const fresh: Snapshot = {
    tokens: usage.context.tokens,
    window: usage.context.window,
    percent: usage.context.percent,
    categories,
  }
  await update($, snapshot, () => fresh)
  $.ui.status(
    fresh.percent === undefined
      ? undefined
      : `ctx ${fresh.percent}% ${compact(fresh.tokens ?? 0)}/${compact(fresh.window)}`,
  )
  // Opening an open pane retitles it; a closed one stays closed.
  if (await read($, paneOpen)) await $.ui.open({ id: PANE, title: title(fresh) })

  return fresh
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const ran = await next(e)
    await $.command.register({
      name: 'context-window',
      description: 'Open or close the context-window pane',
    })
    const fresh = await measure($)
    await openPane($, fresh)

    return ran
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('context')) {
      const before = await read($, snapshot)
      const fresh = await measure($)
      if (crossed(before?.percent, fresh.percent, MARKS) !== undefined) {
        $.ui.toast(`Context window ${fresh.percent}% full; /compact frees room`)
      }
    }

    return next(e)
  })

  on('command.run', { command: 'context-window' }, async $ => {
    if (await isOpen($)) {
      await update($, paneOpen, () => false)
      await $.ui.close({ id: PANE })
      return { text: 'Context-window pane closed.' }
    }
    await openPane($, await read($, snapshot))

    return { text: 'Context-window pane opened.' }
  })

  on('ui.close', { id: PANE }, async ($, e, next) => {
    await update($, paneOpen, () => false)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const snap = await read($, snapshot)
    if (snap === null) {
      return <Text dimColor>Measuring…</Text>
    }

    const percent = snap.percent
    const list = rows(snap.categories)
    const deferred = snap.categories.filter(c => c.kind === 'deferred').reduce((s, c) => s + c.tokens, 0)
    const cols = e.props.bodyColumns
    // Block glyphs can draw wider than a cell on some fonts: leave slack, and
    // draw the bar as one truncating line so it can never wrap onto a second.
    const width = Math.max(10, Math.floor((cols - 2) * 0.9))
    const rowWidth = Math.min(cols, 44)

    const bar = (
      <Box flexDirection="row" overflow="hidden">
        <Text wrap="truncate-end">
          {split(
            list.map(c => c.tokens),
            width,
            list.map(c => c.kind === 'used'),
          ).map((cells, i) => {
            const c = list[i]!
            return cells > 0 ? (
              <Text color={c.hex} dimColor={c.kind === 'free'}>
                {GLYPH[c.kind].repeat(cells)}
              </Text>
            ) : null
          })}
        </Text>
      </Box>
    )

    const legend = list.map(c => (
      <Box key={c.name} width={rowWidth} flexDirection="row">
        <Text color={c.hex} dimColor={c.kind === 'free'}>
          {GLYPH[c.kind].repeat(2)}{'  '}
        </Text>
        <Box flexGrow={1}>
          <Text dimColor={c.kind !== 'used'} wrap="truncate">
            {c.name}
          </Text>
        </Box>
        <Text bold={c.kind === 'used'} dimColor={c.kind !== 'used'}>
          {compact(c.tokens).padStart(5)}
        </Text>
        <Text dimColor>{pct(c.share).padStart(7)}</Text>
      </Box>
    ))

    return (
      <Box flexDirection="column" paddingX={1}>
        <Text>
          <Text bold color={percent === undefined ? 'inactive' : tone(percent)}>
            {percent === undefined ? 'Waiting for first reply' : `${percent}% used`}
          </Text>
          <Text dimColor>
            {'  '}
            {snap.tokens === undefined ? '—' : compact(snap.tokens)} / {compact(snap.window)} tokens
          </Text>
        </Text>
        <Box marginY={1}>{bar}</Box>
        <Box flexDirection="row" flexWrap="wrap" columnGap={3}>
          {legend}
        </Box>
        {deferred > 0 ? (
          <Box marginTop={1}>
            <Text dimColor italic>
              + {compact(deferred)} of tool schemas load on demand and sit outside the window
            </Text>
          </Box>
        ) : null}
      </Box>
    )
  })
}
