'use client';

import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { ReactNode } from 'react';

/**
 * 세션 타임아웃 관리 프로바이더
 * RootLayout 내부에서 사용하여 전역적으로 세션 타임아웃 기능 제공
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  // 세션 타임아웃 활성화 (30분 비활동 시 자동 로그아웃)
  useSessionTimeout();

  return <>{children}</>;
}
