'use client';

import { useState } from 'react';
import { vscode } from '@/lib/vscode';

export default function Home() {
  const [response, setResponse] = useState<string>('');

  const handleTestAlert = async () => {
    try {
      const result = await vscode.request('showAlert', { text: 'Hello from Next.js in VS Code Webview!' });
      if (result?.success) {
        setResponse('Alert shown successfully!');
      }
    } catch (err: any) {
      setResponse(`Error: ${err.message}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-950 text-white">
      <div className="z-10 w-full max-w-5xl items-center justify-center flex flex-col space-y-6">
        <h1 className="text-4xl font-bold">Buddhi AI Webview</h1>
        <p className="text-xl text-zinc-400">Powered by Next.js & Tailwind CSS</p>
        
        <button 
          onClick={handleTestAlert}
          className="px-6 py-3 mt-8 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold text-white transition-colors"
        >
          Show VS Code Alert
        </button>

        {response && (
          <p className="mt-4 text-emerald-400 text-sm">{response}</p>
        )}
      </div>
    </main>
  );
}
