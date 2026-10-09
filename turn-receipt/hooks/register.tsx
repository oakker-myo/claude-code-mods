import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Receipt, Tokens } from '../types'
import {
  cells,
  compact,
  duration,
  emptyTokens,
  estimate,
  find,
  outputList,
  pct,
  shortModel,
  tail,
  toolList,
  total,
  usd,
} from './format'

const receipts = atom({ plugin: 'turn-receipt', key: 'receipts' } as const, [])
const isHidden = atom({ plugin: 'turn-receipt', key: 'isHidden' } as const, false)

const KEEP = 100

export const register: Register = on => {
  // The main turn in progress. Module state: a reload mid-turn loses that one receipt.
  let current: {
    turnId: string
    usd?: number
    context?: number
    tools: Record<string, number>
    /** tool_use_id to tool name, to file each result under its tool. */
    names: Record<string, string>
    toolOutput: Record<string, number>
    subagents: number
    uuid?: string
  } | null = null

  on('session.start', async ($, e, next) => {
    const ran = await next(e)
    await $.command.register({
      name: 'turn-receipt',
      description: 'Show or hide the receipt under each turn',
    })

    return ran
  })

  on('turn.start', async ($, e, next) => {
    const usage = await $.session.usage()
    current = {
      turnId: e.turnId,
      usd: usage.cost?.usd,
      context: usage.context.tokens,
      tools: {},
      names: {},
      toolOutput: {},
      subagents: 0,
    }

    return next(e)
  })

  on('tool.call', ($, e, next) => {
    if (current) {
      current.tools[e.tool] = (current.tools[e.tool] ?? 0) + 1
      current.names[e.tool_use_id] = e.tool
    }

    return next(e)
  })

  on('session.append', async ($, e, next) => {
    const stored = await next(e)
    const hasText = e.message.content.some(b => (b as { type?: string }).type === 'text')
    if (current && e.door === 'response' && e.agentId === undefined && hasText) {
      current.uuid = stored.uuid
    }
    // Tool results the main loop feeds back become input of its next request.
    if (current && e.door === 'tool-result' && e.agentId === undefined) {
      for (const b of e.message.content) {
        const block = b as { type?: string; tool_use_id?: string; content?: unknown }
        if (block.type !== 'tool_result') continue
        const name = current.names[block.tool_use_id ?? ''] ?? 'Other'
        current.toolOutput[name] = (current.toolOutput[name] ?? 0) + estimate(block.content)
      }
    }

    return stored
  })

  on('turn.complete', async ($, e, next) => {
    const ran = await next(e)
    const u = e.usage

    if (e.agentId !== undefined) {
      if (current && u) {
        current.subagents +=
          u.input_tokens + u.output_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens
      }
      return ran
    }
    if (!current || current.turnId !== e.turnId) return ran

    const after = await $.session.usage()
    const tokens: Tokens = {
      ...emptyTokens(),
      input: u?.input_tokens ?? 0,
      cacheRead: u?.cache_read_input_tokens ?? 0,
      cacheWrite: u?.cache_creation_input_tokens ?? 0,
      output: u?.output_tokens ?? 0,
      subagents: current.subagents,
    }
    const receipt: Receipt = {
      turnId: e.turnId,
      uuid: current.uuid,
      answerTail: tail(e.answer),
      usd:
        after.cost?.usd !== undefined && current.usd !== undefined
          ? Math.max(0, after.cost.usd - current.usd)
          : undefined,
      durationMs: e.durationMs,
      model: u?.model,
      tokens,
      contextDelta:
        after.context.tokens !== undefined && current.context !== undefined
          ? after.context.tokens - current.context
          : undefined,
      tools: current.tools,
      toolOutput: current.toolOutput,
      isAborted: e.isAborted,
    }
    current = null
    await update($, receipts, list => [...list, receipt].slice(-KEEP))

    return ran
  })

  on('command.run', { command: 'turn-receipt' }, async $ => {
    const hidden = await update($, isHidden, h => !h)

    return { text: hidden ? 'Turn receipts hidden.' : 'Turn receipts shown.' }
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const list = await read($, receipts)
    const r = find(list, e.requestId, e.props.text)
    if (!r || (await read($, isHidden))) return next(e)

    const message = await next(e)
    const { Box, Text } = $.ui.resolve(e)
    const all = total(r.tokens)
    const width = Math.max(16, Math.min(48, (e.viewport?.columns ?? 80) - 12))
    const tools = toolList(r.tools)
    const fed = outputList(r.toolOutput ?? {})
    const fedTotal = Object.values(r.toolOutput ?? {}).reduce((s, n) => s + n, 0)
    const model = shortModel(r.model)

    const receipt = (
      <Box
        key={`receipt-${r.turnId}`}
        flexDirection="column"
        borderStyle="round"
        borderColor="subtle"
        paddingX={2}
        paddingY={1}
        rowGap={1}
        marginTop={1}
      >
        <Text>
          <Text bold>{usd(r.usd)}</Text>
          <Text dimColor>
            {'  ·  '}
            {compact(all)} tokens{'  ·  '}
            {duration(r.durationMs)}
            {model ? `  ·  ${model}` : ''}
            {r.contextDelta !== undefined && r.contextDelta !== 0
              ? `  ·  context ${r.contextDelta > 0 ? '+' : '−'}${compact(Math.abs(r.contextDelta))}`
              : ''}
            {r.isAborted ? '  ·  interrupted' : ''}
          </Text>
        </Text>
        {all > 0 ? (
          <Box overflow="hidden">
            <Text wrap="truncate-end">
              {cells(r.tokens, width).map(s => (
                <Text color={s.category.hex}>{'█'.repeat(s.cells)}</Text>
              ))}
            </Text>
          </Box>
        ) : null}
        {all > 0 ? (
          <Box flexDirection="row" flexWrap="wrap" columnGap={3}>
            {cells(r.tokens, width).map(s => (
              <Text key={s.category.key}>
                <Text color={s.category.hex}>██</Text>
                <Text> {s.category.name} </Text>
                <Text bold>{compact(r.tokens[s.category.key])}</Text>
                <Text dimColor> {pct(r.tokens[s.category.key], all)}</Text>
              </Text>
            ))}
          </Box>
        ) : null}
        <Box flexDirection="column">
          <Text dimColor wrap="wrap">
            {tools ? `Tools  ${tools}` : 'No tools ran'}
          </Text>
          {fedTotal > 0 ? (
            <Text wrap="wrap">
              <Text dimColor>Tool output fed back  </Text>
              <Text bold>≈{compact(fedTotal)}</Text>
              <Text dimColor>  ({fed})</Text>
            </Text>
          ) : null}
        </Box>
      </Box>
    )

    return (
      <Box flexDirection="column">
        {message}
        {receipt}
      </Box>
    )
  })
}
