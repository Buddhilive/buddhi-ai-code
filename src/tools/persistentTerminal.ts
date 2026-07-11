import * as vscode from 'vscode';

export class PersistentTerminal {
  private static instance: vscode.Terminal | null = null;
  private static readonly TERMINAL_NAME = 'Buddhi AI';

  public static getOrCreate(context: vscode.ExtensionContext): vscode.Terminal {
    if (this.instance) {
      return this.instance;
    }

    this.instance = vscode.window.createTerminal(this.TERMINAL_NAME);
    
    // Listen for terminal close to recreate it next time
    const disposable = vscode.window.onDidCloseTerminal((t) => {
      if (t.name === this.TERMINAL_NAME) {
        this.instance = null;
        disposable.dispose();
      }
    });
    
    context.subscriptions.push(disposable);
    
    return this.instance;
  }
}
