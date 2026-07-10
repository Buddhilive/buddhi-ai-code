/**
 * A utility wrapper around the VS Code Webview API.
 * This provides a typed request-response message bridge.
 */

interface WebviewApi<StateType> {
  postMessage(msg: unknown): void;
  getState(): StateType | undefined;
  setState(state: StateType): void;
}

declare global {
  function acquireVsCodeApi<StateType = any>(): WebviewApi<StateType>;
}

class VSCodeAPIWrapper {
  private readonly vsCodeApi: WebviewApi<unknown> | undefined;

  constructor() {
    if (typeof acquireVsCodeApi === 'function') {
      this.vsCodeApi = acquireVsCodeApi();
    }
  }

  /**
   * Post a message to the extension host and wait for a response.
   * @param command The command name to send.
   * @param args Optional arguments payload.
   */
  public async request<T = any>(command: string, args?: any): Promise<T> {
    if (!this.vsCodeApi) {
      console.warn('VS Code API is not available. Command:', command);
      return Promise.resolve({} as T);
    }

    const requestId = Math.random().toString(36).substring(7);

    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        const message = event.data;
        if (message.requestId === requestId) {
          window.removeEventListener('message', handler);
          if (message.error) {
            reject(new Error(message.error));
          } else {
            resolve(message.payload);
          }
        }
      };

      window.addEventListener('message', handler);
      this.vsCodeApi?.postMessage({ command, requestId, args });
    });
  }

  /**
   * Post a fire-and-forget message to the extension host.
   */
  public postMessage(command: string, args?: any): void {
    if (this.vsCodeApi) {
      this.vsCodeApi.postMessage({ command, args });
    } else {
      console.warn('VS Code API is not available. Command:', command);
    }
  }

  public getState<T>(): T | undefined {
    return this.vsCodeApi?.getState() as T | undefined;
  }

  public setState<T>(state: T): void {
    this.vsCodeApi?.setState(state);
  }
}

// Export a singleton instance
export const vscode = new VSCodeAPIWrapper();
