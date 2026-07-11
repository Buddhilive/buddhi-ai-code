import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as toolHandlers from './tools/toolHandlers';

export class BuddhiWebviewProvider implements vscode.WebviewViewProvider {
	private _proxyServer?: http.Server;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _context: vscode.ExtensionContext
	) {
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

			const proxyHeaders = { ...req.headers };
			delete proxyHeaders.host;
			delete proxyHeaders.origin;
			delete proxyHeaders.referer;

			const options = {
				hostname: '127.0.0.1',
				port: 9379,
				path: req.url,
				method: req.method,
				headers: {
					...proxyHeaders,
					host: '127.0.0.1:9379'
				}
			};
			
			const proxy = http.request(options, (proxyRes) => {
				const headers = { ...proxyRes.headers };
				delete headers['access-control-allow-origin'];
				delete headers['access-control-allow-methods'];
				delete headers['access-control-allow-headers'];
				delete headers['access-control-expose-headers'];
				delete headers['access-control-allow-credentials'];

				headers['access-control-allow-origin'] = '*';
				headers['access-control-allow-methods'] = 'GET, POST, OPTIONS, PUT, PATCH, DELETE';
				headers['access-control-allow-headers'] = '*';

				res.writeHead(proxyRes.statusCode || 200, headers);
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
				
				if (command.startsWith('tool:')) {
					switch (command) {
						case 'tool:view_file': payload = await toolHandlers.handleViewFile(args, this._context); break;
						case 'tool:write_to_file': payload = await toolHandlers.handleWriteToFile(args, this._context); break;
						case 'tool:replace_file_content': payload = await toolHandlers.handleReplaceFileContent(args, this._context); break;
						case 'tool:multi_replace_file_content': payload = await toolHandlers.handleMultiReplaceFileContent(args, this._context); break;
						case 'tool:list_dir': payload = await toolHandlers.handleListDir(args, this._context); break;
						case 'tool:find_by_name': payload = await toolHandlers.handleFindByName(args, this._context); break;
						case 'tool:grep_search': payload = await toolHandlers.handleGrepSearch(args, this._context); break;
						case 'tool:read_url_content': payload = await toolHandlers.handleReadUrlContent(args, this._context); break;
						case 'tool:run_command': payload = await toolHandlers.handleRunCommand(args, this._context); break;
						case 'tool:manage_task': payload = await toolHandlers.handleManageTask(args, this._context); break;
						case 'tool:schedule': payload = await toolHandlers.handleSchedule(args, this._context); break;
						case 'tool:list_permissions': payload = await toolHandlers.handleListPermissions(args, this._context); break;
						// ask_permission is handled purely in webview, but just in case:
						case 'tool:ask_permission': payload = 'Permission handled in webview'; break;
						default:
							console.warn(`Unknown tool command: ${command}`);
							throw new Error(`Unknown tool command: ${command}`);
					}
				} else {
					switch (command) {
						case 'showAlert':
							vscode.window.showInformationMessage(args?.text || text);
							payload = { success: true };
							break;
						case 'consoleLog':
							console.log(`[Webview LOG] ${args?.text || text || ''}`);
							break;
						case 'consoleWarn':
							console.warn(`[Webview WARN] ${args?.text || text || ''}`);
							break;
						case 'consoleError':
							console.error(`[Webview ERROR] ${args?.text || text || ''}`);
							break;
						default:
							console.warn(`Unknown command: ${command}`);
					}
				}

				if (requestId) {
					webviewView.webview.postMessage({ requestId, payload });
				}
			} catch (error: any) {
				if (requestId) {
					webviewView.webview.postMessage({ requestId, error: String(error?.message || error) });
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
