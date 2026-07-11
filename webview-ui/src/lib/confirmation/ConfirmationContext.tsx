import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface ConfirmationRequest {
  id: string;
  title: string;
  description: string;
  resolve: (value: boolean) => void;
}

// Global registry for non-React callers
type Listener = (req: ConfirmationRequest) => void;
const listeners: Listener[] = [];

export function requestConfirmation(title: string, description: string): Promise<boolean> {
  return new Promise((resolve) => {
    const id = Math.random().toString(36).substring(7) + Date.now().toString(36);
    const req = { id, title, description, resolve };
    listeners.forEach(l => l(req));
  });
}

// To allow resolving from anywhere (not strictly needed since React component resolves, but good to have)
let globalResolve: ((id: string, result: boolean) => void) | null = null;

export function resolveConfirmationGlobal(id: string, result: boolean) {
  if (globalResolve) {
    globalResolve(id, result);
  }
}

interface ConfirmationContextType {
  pendingConfirmations: ConfirmationRequest[];
  resolveConfirmation: (id: string, result: boolean) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [pendingConfirmations, setPendingConfirmations] = useState<ConfirmationRequest[]>([]);

  useEffect(() => {
    const listener = (req: ConfirmationRequest) => {
      setPendingConfirmations((prev) => [...prev, req]);
    };
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const resolveConfirmation = useCallback((id: string, result: boolean) => {
    setPendingConfirmations((prev) => {
      const confirmation = prev.find((req) => req.id === id);
      if (confirmation) {
        confirmation.resolve(result);
      }
      return prev.filter((req) => req.id !== id);
    });
  }, []);

  useEffect(() => {
    globalResolve = resolveConfirmation;
    return () => {
      globalResolve = null;
    };
  }, [resolveConfirmation]);

  return (
    <ConfirmationContext.Provider value={{ pendingConfirmations, resolveConfirmation }}>
      {children}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
}
