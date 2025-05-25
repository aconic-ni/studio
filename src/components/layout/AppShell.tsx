import type React from 'react';
import { AppHeader } from './AppHeader';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col grid-bg text-primary-foreground">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl">
        {children}
      </main>
      <footer className="py-4 text-center text-sm bg-card text-card-foreground border-t">
        Stvaer © {new Date().getFullYear()} <em className="italic">for</em> ACONIC.
      </footer>
    </div>
  );
}
