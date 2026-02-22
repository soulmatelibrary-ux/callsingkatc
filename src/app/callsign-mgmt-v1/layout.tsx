import { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';

export default function CallsignMgmtV1PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
