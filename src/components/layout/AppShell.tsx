import { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Header />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
