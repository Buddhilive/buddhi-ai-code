'use client';

import { useState } from 'react';
import { ChatHeader } from '@/components/chat-header';
import { ChatThread } from '@/components/chat-thread';
import { ChatInput } from '@/components/chat-input';
import { type Message } from '@/components/message-bubble';
import { useAgent } from '@/lib/hooks/useAgent';

export default function Home() {
  const { messages, isStreaming: isTyping, sendMessage: handleSend } = useAgent();

  return (
    <main className="h-dvh flex flex-col overflow-hidden bg-background text-foreground">
      <ChatHeader />
      <ChatThread messages={messages} isTyping={isTyping} />
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </main>
  );
}
