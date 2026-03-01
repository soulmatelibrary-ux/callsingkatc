'use client';

import { Providers } from '@/components/layout/Providers';

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
