import { Settings } from 'lucide-react';
import { Button } from './ui/button';

export function ChatHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold tracking-tight">Buddhi AI</h1>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
        <Settings className="h-4 w-4" />
        <span className="sr-only">Settings</span>
      </Button>
    </header>
  );
}
