export type Tokens = {
  input: number
  cacheRead: number
  cacheWrite: number
  output: number
  subagents: number
}

export type Receipt = {
  turnId: string
  /** Transcript id of the turn's last reply row that held text. */
  uuid?: string
  /** The end of the turn's answer, to find its row when the id does not match. */
  answerTail: string
  usd?: number
  durationMs: number
  model?: string
  tokens: Tokens
  /** Context-window tokens added by the turn, when both readings exist. */
  contextDelta?: number
  tools: Record<string, number>
  /** Estimated tokens of tool output fed back to the model, by tool. */
  toolOutput?: Record<string, number>
  isAborted: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'turn-receipt': { receipts: Receipt[]; isHidden: boolean }
  }
}
