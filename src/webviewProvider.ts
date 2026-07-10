import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class BuddhiWebviewProvider implements vscode.WebviewViewProvider {
	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async (data) => {
			const { command, requestId, args, text } = data;
			try {
				let payload;
				switch (command) {
					case 'showAlert':
						vscode.window.showInformationMessage(args?.text || text);
						payload = { success: true };
						break;
					default:
						console.warn(`Unknown command: ${command}`);
				}
				if (requestId) {
					webviewView.webview.postMessage({ requestId, payload });
				}
			} catch (error) {
				if (requestId) {
					webviewView.webview.postMessage({ requestId, error: String(error) });
				}
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const outDir = path.join(this._extensionUri.fsPath, 'webview-ui', 'out');
		const indexPath = path.join(outDir, 'index.html');

		try {
			let html = fs.readFileSync(indexPath, 'utf8');

			const webviewUri = webview.asWebviewUri(vscode.Uri.file(outDir)).toString();

			// Inject <base> tag and patch history API to prevent Next.js App Router from crashing the webview by navigating
			const patchScript = `
				<base href="${webviewUri}/">
				<script>
					window.history.pushState = function() {};
					window.history.replaceState = function() {};
				</script>
			`;
			html = html.replace('<head>', `<head>\n${patchScript}`);

			return html;
		} catch (error) {
			console.error('Error reading index.html:', error);
			return `<!DOCTYPE html>
				<html lang="en">
				<body>
					<p>Failed to load webview. Please build the Next.js UI first.</p>
				</body>
				</html>`;
		}
	}
}
