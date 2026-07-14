import React from 'react';
import { Activity, Database, CheckCircle2 } from 'lucide-react';

interface AgentStatusBarProps {
  tokenCount: number;
  maxTokens: number;
  compactionThreshold: number;
}

export function AgentStatusBar({ tokenCount, maxTokens, compactionThreshold }: AgentStatusBarProps) {
  const percentage = Math.min(100, Math.round((tokenCount / maxTokens) * 100));
  const isNearLimit = tokenCount > maxTokens - compactionThreshold;

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-t border-border/50 text-xs text-muted-foreground w-full">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5" title="Agent Status">
          <Activity className="h-3.5 w-3.5 text-green-500" />
          <span>Online</span>
        </div>
        <div className="flex items-center gap-1.5" title="Context Compaction System">
          {isNearLimit ? (
            <Database className="h-3.5 w-3.5 text-warning animate-pulse" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span>Context: {percentage}%</span>
        </div>
      </div>
      <div className="flex items-center gap-2" title="Context Token Usage">
        <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${isNearLimit ? 'bg-warning' : 'bg-primary'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="font-mono">{tokenCount.toLocaleString()} / {maxTokens.toLocaleString()}</span>
      </div>
    </div>
  );
}
