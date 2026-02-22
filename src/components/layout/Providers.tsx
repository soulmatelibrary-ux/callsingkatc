/**
 * 클라이언트 사이드 Provider 래퍼
 * - TanStack Query QueryClientProvider
 * - 페이지 로드 시 refreshToken 쿠키로 세션 복원
 * Next.js App Router에서 'use client'가 필요한 Provider를 분리
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { AnnouncementModal } from '@/components/announcements/AnnouncementModal';

interface ProvidersProps {
  children: React.ReactNode;
}

function AuthInitializer({ children }: ProvidersProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const authStore = useAuthStore();

  useEffect(() => {
    // 페이지 로드 시 한 번만 세션 복원 (refreshToken 쿠키 → 새로운 accessToken)
    async function initializeAuth() {
      const hasRefreshToken =
        typeof document !== 'undefined' && document.cookie.includes('refreshToken=');

      console.log('[AuthInitializer] refreshToken exists:', hasRefreshToken);

      if (!hasRefreshToken) {
        console.log('[AuthInitializer] No refreshToken, initialization complete (not logged in)');
        setIsInitialized(true);
        return;
      }

      try {
        console.log('[AuthInitializer] Attempting to refresh token...');
        // refreshToken 쿠키로부터 새로운 accessToken 생성
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include', // 중요: refreshToken 쿠키 자동 포함
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[AuthInitializer] Token refresh successful, user:', data.user.email);
          // accessToken과 user 정보 동시에 저장
          authStore.setAuth(data.user, data.accessToken);
        } else {
          console.warn('[AuthInitializer] Token refresh failed:', response.status);
        }
        // 토큰 갱신 실패 또는 성공 → 초기화 완료 (로그인 상태 아님)
      } catch (error) {
        console.error('[AuthInitializer] Session restoration error:', error);
      } finally {
        setIsInitialized(true);
      }
    }

    initializeAuth();
  }, []); // ✅ 페이지 로드 시 한 번만 실행

  // 초기화 전 children 렌더링 (UX 개선: 로딩 상태 표시 필요하면 여기서 처리)
  // SessionProvider로 감싸서 30분 비활동 자동 로그아웃 기능 활성화
  // AnnouncementModal: 모든 페이지에서 활성 공지사항 팝업 표시
  return (
    <SessionProvider>
      <AnnouncementModal />
      {children}
    </SessionProvider>
  );
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,        // 1분
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>{children}</AuthInitializer>
    </QueryClientProvider>
  );
}
