import React from 'react';
import { useConfirmation } from '../lib/confirmation/ConfirmationContext';
import { AlertTriangle, CheckCircle, XCircle, FileEdit, TerminalSquare } from 'lucide-react';

export function ConfirmationBanner() {
  const { pendingConfirmations, resolveConfirmation } = useConfirmation();

  if (pendingConfirmations.length === 0) {
    return null;
  }

  const current = pendingConfirmations[0];
  const risk = current.riskLevel || 'shell';
  
  let Icon = AlertTriangle;
  let borderColor = 'border-warning';
  let bgColor = 'bg-warning/10';
  let iconColor = 'text-warning';

  if (risk === 'shell') {
    Icon = TerminalSquare;
    borderColor = 'border-destructive';
    bgColor = 'bg-destructive/10';
    iconColor = 'text-destructive';
  } else if (risk === 'file-write') {
    Icon = FileEdit;
    borderColor = 'border-blue-500/50';
    bgColor = 'bg-blue-500/10';
    iconColor = 'text-blue-500';
  }

  return (
    <div className="mx-auto max-w-3xl w-full px-4 mb-4">
      <div className={`flex flex-col rounded-xl border ${borderColor} ${bgColor} p-4 shadow-sm animate-in slide-in-from-bottom-2 fade-in duration-200`}>
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 ${iconColor} mt-0.5 shrink-0`} />
          <div className="flex-1 space-y-2 overflow-hidden">
            <h4 className="text-sm font-medium text-foreground">{current.title}</h4>
            
            {current.toolName && current.args && (
              <div className="text-xs font-mono bg-background/50 p-2 rounded border border-border/50 text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                <div className="font-bold text-foreground mb-1">{current.toolName}</div>
                {Object.entries(current.args).map(([k, v]) => (
                  <div key={k} className="pl-2">
                    <span className="text-foreground/80">{k}:</span> {typeof v === 'string' ? `"${v}"` : JSON.stringify(v)}
                  </div>
                ))}
              </div>
            )}
            {current.description && (
              <p className="text-sm text-muted-foreground break-all">
                {current.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={() => resolveConfirmation(current.id, false)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <XCircle className="h-4 w-4" />
            Deny
          </button>
          <button
            onClick={() => resolveConfirmation(current.id, true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
