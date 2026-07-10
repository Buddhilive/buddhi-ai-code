'use client';

import { useState } from 'react';
import { ChatHeader } from '@/components/chat-header';
import { ChatThread } from '@/components/chat-thread';
import { ChatInput } from '@/components/chat-input';
import { type Message } from '@/components/message-bubble';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (text: string) => {
    // 1. Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    // 2. Show typing indicator
    setIsTyping(true);
    
    // 3. Simulate network/processing delay (~300ms to 600ms)
    const delay = 300 + Math.random() * 300;
    
    setTimeout(() => {
      // 4. Add assistant echo message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, delay);
  };

  return (
    <main className="h-dvh flex flex-col overflow-hidden bg-background text-foreground">
      <ChatHeader />
      <ChatThread messages={messages} isTyping={isTyping} />
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </main>
  );
}
