import { useEffect, useRef } from 'react';
import { Message, MessageBubble } from './message-bubble';
import { Bot } from 'lucide-react';

interface ChatThreadProps {
  messages: Message[];
  isTyping?: boolean;
}

export function ChatThread({ messages, isTyping }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or typing state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-2">
        {messages.length === 0 ? (
          <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50">
              <Bot className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">How can I help you today?</h2>
              <p className="text-sm">Start a conversation below.</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              isStreaming={isTyping && index === messages.length - 1} 
            />
          ))
        )}

        {isTyping && (
          <div className="flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 justify-start">
            <div className="flex w-full flex-col items-start gap-1">
              <div className="w-full py-2">
                <div className="flex h-6 items-center gap-1">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invisible div to scroll to */}
        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  );
}
