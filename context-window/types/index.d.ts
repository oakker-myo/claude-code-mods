export type Category = {
  name: string
  tokens: number
  color: string
  kind: 'used' | 'free' | 'buffer' | 'deferred'
}

export type Snapshot = {
  tokens?: number
  window: number
  percent?: number
  categories: Category[]
}

declare module 'claude-code' {
  interface PluginState {
    'context-window': { snapshot: Snapshot | null; paneOpen: boolean }
  }
}
