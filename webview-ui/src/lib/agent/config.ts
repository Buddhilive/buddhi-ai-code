// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isWebview = typeof window !== 'undefined' && typeof (window as any).acquireVsCodeApi === 'function';

export const AGENT_CONFIG = {
  // Use the VS Code extension proxy when inside VS Code webview;
  // otherwise, use the Vite dev server's proxy using an absolute URL (window.location.origin + '/v1').
  baseUrl: isWebview
    ? 'http://127.0.0.1:9380/v1'
    : (typeof window !== 'undefined' ? `${window.location.origin}/v1` : 'http://127.0.0.1:9379/v1'),
  modelName: 'gemma4-e4b',
  temperature: 0.7,
  maxTokens: 2000,
};

