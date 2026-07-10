import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'group flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-1',
          isUser ? 'max-w-[85%] items-end' : 'w-full items-start'
        )}
      >
        <div
          className={cn(
            isUser
              ? 'bg-secondary text-secondary-foreground rounded-2xl px-4 py-2.5 text-sm'
              : 'w-full py-2 text-sm text-foreground'
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
