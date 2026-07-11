import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { vscode } from './lib/vscode';

// Redirect Webview console logs to VS Code Extension Host
if (typeof acquireVsCodeApi === 'function') {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => {
    originalLog(...args);
    vscode.postMessage('consoleLog', { text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
  };

  console.error = (...args) => {
    originalError(...args);
    vscode.postMessage('consoleError', { text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
  };

  console.warn = (...args) => {
    originalWarn(...args);
    vscode.postMessage('consoleWarn', { text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
  };

  window.addEventListener('error', (event) => {
    vscode.postMessage('consoleError', { text: `Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}` });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason instanceof Error ? `${reason.message}\n${reason.stack}` : String(reason);
    vscode.postMessage('consoleError', { text: `Unhandled Promise Rejection: ${msg}` });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
