import React from 'react';
import { Terminal, FileEdit, FolderSearch, CheckCircle2, Loader2, Wrench } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ToolCallBubbleProps {
  toolName: string;
  args: Record<string, any>;
  status: 'pending' | 'success' | 'error';
  result?: string;
}

export function ToolCallBubble({ toolName, args, status, result }: ToolCallBubbleProps) {
  let Icon = Wrench;
  if (toolName.includes('command')) Icon = Terminal;
  else if (toolName.includes('file')) Icon = FileEdit;
  else if (toolName.includes('search') || toolName.includes('find') || toolName.includes('dir')) Icon = FolderSearch;

  return (
    <div className="flex w-full animate-in fade-in duration-300 my-2">
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/30 p-2 rounded-md border border-border/50">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">
            {toolName}
            <span className="opacity-70 ml-2 font-mono text-[10px]">
              {Object.keys(args).length > 0 ? JSON.stringify(args).substring(0, 50) + (JSON.stringify(args).length > 50 ? '...' : '') : ''}
            </span>
          </span>
          {status === 'pending' && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
          {status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
          {status === 'error' && <div className="h-2 w-2 rounded-full bg-destructive" />}
        </div>
        {result && (
          <div className="ml-6 border-l-2 border-border/50 pl-3 py-1">
            <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap break-all bg-background/50 p-2 rounded max-h-40 overflow-y-auto">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
