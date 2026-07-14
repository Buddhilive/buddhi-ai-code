import { useState, useCallback } from 'react';
import { runAgent, StreamEvent } from '../agent';
import { BaseMessage } from '@langchain/core/messages';
import { estimateTokens, countMessagesTokens } from '../agent/compaction';
import { logSession } from '../agent/sessionLogger';

export interface UIState {
  messages: BaseMessage[];
  tokenCount: number;
  isStreaming: boolean;
  pendingToolCalls: Record<string, { name: string; args: any; status: 'pending' | 'success' | 'error'; result?: string }>;
}

export function useAgent() {
  const [state, setState] = useState<UIState>({
    messages: [],
    tokenCount: 0,
    isStreaming: false,
    pendingToolCalls: {}
  });

  const sendMessage = useCallback(
    async (text: string) => {
      setState(prev => ({
        ...prev,
        isStreaming: true,
      }));

      try {
        const stream = runAgent(text);

        for await (const chunk of stream) {
          if (chunk.type === 'chunk') {
            // Text chunk logic could go here if we want to render streaming text over the real state
            // But state_update will give us the final messages anyway
          } else if (chunk.type === 'tool_call') {
            setState(prev => ({
              ...prev,
              pendingToolCalls: {
                ...prev.pendingToolCalls,
                [chunk.id]: { name: chunk.name, args: chunk.args, status: 'pending' }
              }
            }));
          } else if (chunk.type === 'tool_result') {
            setState(prev => ({
              ...prev,
              pendingToolCalls: {
                ...prev.pendingToolCalls,
                [chunk.id]: {
                  ...prev.pendingToolCalls[chunk.id],
                  status: chunk.status,
                  result: chunk.result
                }
              }
            }));
          } else if (chunk.type === 'state_update') {
            setState(prev => ({
              ...prev,
              messages: chunk.messages,
              tokenCount: countMessagesTokens(chunk.messages)
            }));
            
            // Log session asynchronously when generation yields state update
            logSession(chunk.messages, countMessagesTokens(chunk.messages)).catch(e => console.error(e));
          }
        }
      } catch (error: any) {
        console.error('Error running agent:', error);
      } finally {
        setState(prev => ({ ...prev, isStreaming: false }));
      }
    },
    []
  );

  return {
    messages: state.messages,
    tokenCount: state.tokenCount,
    isStreaming: state.isStreaming,
    pendingToolCalls: state.pendingToolCalls,
    sendMessage,
  };
}
