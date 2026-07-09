import * as vscode from 'vscode';

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

		webviewView.webview.html = this._getHtmlForWebview();

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.command) {
				case 'showAlert':
					vscode.window.showInformationMessage(data.text);
					break;
			}
		});
	}

	private _getHtmlForWebview() {
		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Buddhi AI</title>
				<style>
					body {
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: center;
						height: 100vh;
						margin: 0;
						padding: 0;
					}
					button {
						padding: 10px 20px;
						font-size: 16px;
						background-color: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						border: none;
						border-radius: 4px;
						cursor: pointer;
					}
					button:hover {
						background-color: var(--vscode-button-hoverBackground);
					}
				</style>
			</head>
			<body>
				<button id="clickBtn">Click me</button>

				<script>
					const vscode = acquireVsCodeApi();
					
					document.getElementById('clickBtn').addEventListener('click', () => {
						vscode.postMessage({
							command: 'showAlert',
							text: 'Namo buddhaya!'
						});
					});
				</script>
			</body>
			</html>`;
	}
}
