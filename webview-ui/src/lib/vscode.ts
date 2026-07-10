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
  function acquireVsCodeApi<StateType = unknown>(): WebviewApi<StateType>;
}

class VSCodeAPIWrapper {
  private vsCodeApi: WebviewApi<unknown> | undefined;

  private getApi() {
    if (!this.vsCodeApi) {
      if (typeof acquireVsCodeApi === 'function') {
        this.vsCodeApi = acquireVsCodeApi();
      }
    }
    return this.vsCodeApi;
  }

  /**
   * Post a message to the extension host and wait for a response.
   * @param command The command name to send.
   * @param args Optional arguments payload.
   */
  public async request<T = unknown>(command: string, args?: unknown): Promise<T> {
    const api = this.getApi();
    if (!api) {
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
      api.postMessage({ command, requestId, args });
    });
  }

  /**
   * Post a fire-and-forget message to the extension host.
   */
  public postMessage(command: string, args?: unknown): void {
    const api = this.getApi();
    if (api) {
      api.postMessage({ command, args });
    } else {
      console.warn('VS Code API is not available. Command:', command);
    }
  }

  public getState<T>(): T | undefined {
    return this.getApi()?.getState() as T | undefined;
  }

  public setState<T>(state: T): void {
    this.getApi()?.setState(state);
  }
}

// Export a singleton instance
export const vscode = new VSCodeAPIWrapper();
