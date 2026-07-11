import React from 'react';
import { useConfirmation } from '../lib/confirmation/ConfirmationContext';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export function ConfirmationBanner() {
  const { pendingConfirmations, resolveConfirmation } = useConfirmation();

  if (pendingConfirmations.length === 0) {
    return null;
  }

  // Only show the first confirmation if there are multiple pending
  const current = pendingConfirmations[0];

  return (
    <div className="mx-auto max-w-3xl w-full px-4 mb-4">
      <div className="flex flex-col rounded-xl border border-warning bg-warning/10 p-4 shadow-sm animate-in slide-in-from-bottom-2 fade-in duration-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-medium text-foreground">{current.title}</h4>
            <p className="text-sm text-muted-foreground break-all">
              {current.description}
            </p>
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
