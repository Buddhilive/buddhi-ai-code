// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isWebview = typeof window !== 'undefined' && typeof (window as any).acquireVsCodeApi === 'function';

export const AGENT_CONFIG = {
  // Use the VS Code extension proxy when inside VS Code webview;
  // otherwise, use the Vite dev server's proxy using an absolute URL (window.location.origin + '/v1').
  baseUrl: isWebview
    ? 'http://127.0.0.1:1234/v1'
    : (typeof window !== 'undefined' ? `${window.location.origin}/v1` : 'http://127.0.0.1:1234/v1'),
  modelName: 'zai-org/glm-4.6v-flash',
  temperature: 0.7,
  maxTokens: 128000,
};

