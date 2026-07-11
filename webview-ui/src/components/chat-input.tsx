import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './message-bubble';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      // Cap at ~5 rows (approx 120px depending on line height)
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;

      // If it hit the cap, enable scrolling
      if (textarea.scrollHeight > 120) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isSendDisabled = disabled || input.trim().length === 0;

  return (
    <div className="sticky bottom-0 z-10 border-t border-border bg-background p-4 pt-2 pb-6">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex flex-col rounded-xl border border-border bg-card shadow-sm focus-within:ring-1 focus-within:ring-ring transition-shadow">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Buddhi AI..."
            className="w-full resize-none bg-transparent px-4 py-3 text-sm focus:outline-none scrollbar-thin max-h-[120px]"
            rows={1}
            disabled={disabled}
          />

          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
              disabled={disabled}
            >
              <Plus className="h-5 w-5" />
              <span className="sr-only">Attach</span>
            </Button>

            <Button
              size="icon"
              onClick={handleSend}
              disabled={isSendDisabled}
              className={cn(
                "h-8 w-8 rounded-full transition-all",
                !isSendDisabled ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
              )}
            >
              <ArrowUp className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
