'use client';

import React, { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Function to sync the body's vscode theme class to the HTML element's dark class
    const syncTheme = () => {
      const isDark = document.body.classList.contains('vscode-dark') || 
                     document.body.classList.contains('vscode-high-contrast');
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Initial sync
    syncTheme();

    // Set up a MutationObserver to watch for changes to the body's class attribute
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          syncTheme();
        }
      }
    });

    observer.observe(document.body, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}
