import { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';

export default function CallsignMgmtV1Layout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
