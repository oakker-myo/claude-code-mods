export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

export type Usage = { limits: Limit[]; usd?: number }

declare module 'claude-code' {
  interface PluginState {
    'plan-usage': { usage: Usage | null; isHidden: boolean }
  }
}
