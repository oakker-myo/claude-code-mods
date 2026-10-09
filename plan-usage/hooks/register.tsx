import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Usage } from '../types'
import { TONE_HEX, crossed, elapsed, label, meter, pace, runs, short, tone, until } from './format'

const usage = atom({ plugin: 'plan-usage', key: 'usage' } as const, null)
const isHidden = atom({ plugin: 'plan-usage', key: 'isHidden' } as const, false)

const MARKS = [80, 95]

type Measured = {
  rateLimits: readonly { kind: string; percentUsed: number; resetsAt?: string }[]
  cost?: { usd: number }
}

const toUsage = (m: Measured): Usage => ({
  limits: m.rateLimits.map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt })),
  usd: m.cost?.usd,
})

const statusText = (u: Usage): string | undefined => {
  const parts = u.limits.map(l => `${short(l.kind)} ${l.percentUsed}%`)
  if (u.usd !== undefined) parts.push(`$${u.usd.toFixed(2)}`)
  return parts.length ? parts.join(' · ') : undefined
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const ran = await next(e)
    await $.command.register({
      name: 'plan-usage',
      description: 'Show or hide the plan-usage band above the prompt',
    })
    const fresh = toUsage(await $.session.usage())
    await update($, usage, () => fresh)
    $.ui.status(statusText(fresh))
    // Keeps the reset countdowns and pace ticks current between turns.
    $.clock.every(60_000, () => $.ui.invalidate('ui.render'))

    return ran
  })

  on('session.measure', async ($, e, next) => {
    const before = await read($, usage)
    const fresh = toUsage(e)
    await update($, usage, () => fresh)
    $.ui.status(statusText(fresh))

    for (const l of fresh.limits) {
      const was = before?.limits.find(b => b.kind === l.kind)?.percentUsed
      if (crossed(was, l.percentUsed, MARKS) !== undefined) {
        $.ui.toast(`${label(l.kind)} limit at ${l.percentUsed}%`)
      }
    }

    return next(e)
  })

  on('command.run', { command: 'plan-usage' }, async $ => {
    const hidden = await update($, isHidden, h => !h)

    return { text: hidden ? 'Plan-usage band hidden.' : 'Plan-usage band shown.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    const u = await read($, usage)
    if (e.props.hasSurvey || u === null || (await read($, isHidden))) {
      return below
    }

    const { Box, Text } = $.ui.resolve(e)
    const now = await $.clock.now()
    const cells = Math.max(10, Math.min(40, e.props.bodyColumns - 48))

    const rowsOut = u.limits.map(l => {
      const at = elapsed(l, now)
      const how = pace(l.percentUsed, at)
      const left = until(l.resetsAt, now)
      const color = tone(l.percentUsed)
      const bar = (
          <Text>
            {runs(meter(l.percentUsed, cells, at)).map(r => (
              <Text
                color={r.kind === 'fill' ? TONE_HEX[color] : r.kind === 'pace' ? 'text' : undefined}
                dimColor={r.kind === 'empty'}
                bold={r.kind === 'pace'}
              >
                {r.text}
              </Text>
            ))}
          </Text>
        )

      return (
        <Box key={l.kind} flexDirection="row" alignItems="center" columnGap={2}>
          <Box width={8}>
            <Text bold>{label(l.kind)}</Text>
          </Box>
          {bar}
          <Box width={6} justifyContent="flex-end">
            <Text bold color={color}>
              {l.percentUsed}%
            </Text>
          </Box>
          <Box width={12}>
            <Text dimColor>{left ? `↻ ${left}` : ''}</Text>
          </Box>
          {how ? (
            <Text
              color={how === 'ahead' ? 'warning' : how === 'behind' ? 'success' : 'inactive'}
              italic
            >
              {how === 'ahead' ? '▲ ahead of pace' : how === 'behind' ? '▼ under pace' : '● on pace'}
            </Text>
          ) : null}
        </Box>
      )
    })

    const card = (
      <Box
        key="plan-usage"
        flexDirection="column"
        borderStyle="round"
        borderColor="suggestion"
        paddingX={1}
        marginBottom={1}
      >
        <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
          <Text bold color="suggestion">
            ◷ Plan usage
          </Text>
          {u.usd !== undefined ? (
            <Text>
              <Text dimColor>this session </Text>
              <Text bold>${u.usd.toFixed(2)}</Text>
            </Text>
          ) : null}
        </Box>
        {rowsOut.length ? (
          <Box flexDirection="column">{rowsOut}</Box>
        ) : (
          <Text dimColor>No reading yet: appears on a Pro or Max plan after the first reply.</Text>
        )}
        {rowsOut.length ? (
          <Box marginTop={1}>
            <Text dimColor>│ marks how much of each window has passed · ↻ time until reset</Text>
          </Box>
        ) : null}
      </Box>
    )

    return below ? (
      <Box flexDirection="column">
        {card}
        {below}
      </Box>
    ) : (
      card
    )
  })
}
