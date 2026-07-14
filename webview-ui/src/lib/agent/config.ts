// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isWebview = typeof window !== 'undefined' && typeof (window as any).acquireVsCodeApi === 'function';

export const AGENT_CONFIG = {
  // LM Studio direct — no CORS proxy needed
  baseUrl: 'http://127.0.0.1:1234/v1',
  modelName: 'zai-org/glm-4.6v-flash',
  temperature: 0.7,
  // Context management
  maxContextTokens: 128000,
  compactionThreshold: 13000,   // trigger compaction this many tokens before limit
  maxToolOutputChars: 50000,    // budget reduction cap per tool call
  // Permission: 'default' | 'acceptEdits' (only two modes in Phase 1)
  permissionMode: 'default' as 'default' | 'acceptEdits',
};

