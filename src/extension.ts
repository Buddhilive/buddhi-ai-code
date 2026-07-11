import * as vscode from 'vscode';
import { BuddhiWebviewProvider } from './webviewProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "buddhi-ai-code" is now active!');

	const provider = new BuddhiWebviewProvider(context.extensionUri, context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('buddhi-ai-webview', provider)
	);
}

export function deactivate() {}
