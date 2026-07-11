import { useState, useCallback } from 'react';
import { runAgent, AgentMessage } from '../agent';
import { Message } from '@/components/message-bubble';

export function useAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      // 1. Add user message to UI
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      // Create a new assistant message ID
      const assistantMessageId = (Date.now() + 1).toString();

      // Add empty assistant message to UI that we will update with streamed chunks
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        },
      ]);

      try {
        // Collect current messages to send to the agent, including the new user message
        // Exclude the currently empty assistant message
        const currentMessages: AgentMessage[] = messages.map(m => ({
          role: m.role,
          content: m.content,
        })).concat({ role: 'user', content: text });

        // 2. Call the agent and consume the stream
        const stream = runAgent(currentMessages);

        for await (const chunk of stream) {
          // 3. Update the specific assistant message with the incoming chunk
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error('Error running agent:', error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + `\n\n*(Error: Failed to fetch from agent - ${error?.message || String(error)})*` }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [messages]
  );

  return {
    messages,
    isStreaming,
    sendMessage,
  };
}
