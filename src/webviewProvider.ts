import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

export class BuddhiWebviewProvider implements vscode.WebviewViewProvider {
	private _proxyServer?: http.Server;

	constructor(private readonly _extensionUri: vscode.Uri) {
		this._startProxy();
	}

	private _startProxy() {
		this._proxyServer = http.createServer((req, res) => {
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
			res.setHeader('Access-Control-Allow-Headers', '*');
			
			if (req.method === 'OPTIONS') {
				res.writeHead(200);
				res.end();
				return;
			}

			const options = {
				hostname: '127.0.0.1',
				port: 9379,
				path: req.url,
				method: req.method,
				headers: { ...req.headers, host: '127.0.0.1:9379' }
			};
			
			const proxy = http.request(options, (proxyRes) => {
				res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
				proxyRes.pipe(res, { end: true });
			});
			
			req.pipe(proxy, { end: true });
			
			proxy.on('error', (e) => {
				console.error('Proxy error:', e);
				if (!res.headersSent) {
					res.writeHead(500);
				}
				res.end();
			});
		});
		
		this._proxyServer.listen(9380, '127.0.0.1', () => {
			console.log('CORS Proxy started on 127.0.0.1:9380');
		});
	}

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

			const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; connect-src ${webview.cspSource} http://127.0.0.1:9380 http://localhost:9380 http://127.0.0.1:9379 http://localhost:9379;">`;

			// Inject CSP, <base> tag, and patch history API
			const patchScript = `
				${csp}
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
