'use client';

import { useState } from 'react';
import { ChatHeader } from '@/components/chat-header';
import { ChatThread } from '@/components/chat-thread';
import { ChatInput } from '@/components/chat-input';
import { type Message } from '@/components/message-bubble';
import { useAgent } from '@/lib/hooks/useAgent';
import { ThemeProvider } from '@/components/theme-provider';
import { ConfirmationProvider } from '@/lib/confirmation/ConfirmationContext';
import { ConfirmationBanner } from '@/components/ConfirmationBanner';
import { AgentStatusBar } from '@/components/agent-status-bar';
import { AGENT_CONFIG } from '@/lib/agent/config';

export default function App() {
  const { messages, tokenCount, isStreaming: isTyping, pendingToolCalls, sendMessage: handleSend } = useAgent();

  return (
    <ThemeProvider>
      <ConfirmationProvider>
        <main className="h-dvh flex flex-col overflow-hidden bg-background text-foreground">
          <ChatHeader />
          <ChatThread messages={messages} pendingToolCalls={pendingToolCalls} isTyping={isTyping} />
          <ConfirmationBanner />
          <ChatInput onSend={handleSend} disabled={isTyping} />
          <AgentStatusBar tokenCount={tokenCount} maxTokens={AGENT_CONFIG.maxContextTokens} compactionThreshold={AGENT_CONFIG.compactionThreshold} />
        </main>
      </ConfirmationProvider>
    </ThemeProvider>
  );
}
