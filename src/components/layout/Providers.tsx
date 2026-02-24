/**
 * 클라이언트 사이드 Provider 래퍼
 * - TanStack Query QueryClientProvider
 * - 페이지 로드 시 refreshToken 쿠키로 세션 복원
 * Next.js App Router에서 'use client'가 필요한 Provider를 분리
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { AnnouncementModal } from '@/components/announcements/AnnouncementModal';
import { ROUTES } from '@/lib/constants';

const PROTECTED_ROUTES = ['/airline', '/admin', '/callsign-management', '/announcements'];

interface ProvidersProps {
  children: React.ReactNode;
}

function AuthInitializer({ children }: ProvidersProps) {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const router = useRouter();

  useEffect(() => {
    // 페이지 로드 시 한 번만 세션 복원 (refreshToken 쿠키 → 새로운 accessToken)
    const redirectToHomeIfUnauthenticated = () => {
      if (typeof window === 'undefined') {
        return;
      }

      const pathname = window.location.pathname;
      const isProtectedRoute = PROTECTED_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      );

      if (isProtectedRoute) {
        if (pathname !== ROUTES.HOME) {
          router.replace(ROUTES.HOME);
        }
      }
    };

    async function initializeAuth() {
      const hasRefreshToken =
        typeof document !== 'undefined' && document.cookie.includes('refreshToken=');

      console.log('[AuthInitializer] refreshToken exists:', hasRefreshToken);

      if (!hasRefreshToken) {
        console.log('[AuthInitializer] No refreshToken, initialization complete (not logged in)');
        redirectToHomeIfUnauthenticated();
        setInitialized(true);
        return;
      }

      try {
        console.log('[AuthInitializer] Attempting to refresh token...');
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
        const timeoutId = typeof window !== 'undefined'
          ? window.setTimeout(() => controller?.abort(), 5000)
          : undefined;
        // refreshToken 쿠키로부터 새로운 accessToken 생성
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include', // 중요: refreshToken 쿠키 자동 포함
          signal: controller?.signal,
        });

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (response.ok) {
          const data = await response.json();
          console.log('[AuthInitializer] Token refresh successful, user:', data.user.email);
          // accessToken과 user 정보 동시에 저장
          setAuth(data.user, data.accessToken);
        } else {
          console.warn('[AuthInitializer] Token refresh failed:', response.status);
          // httpOnly 쿠키는 클라이언트에서 삭제 불가 → logout API로 서버에서 삭제
          // 미들웨어와 클라이언트 인증 상태 불일치로 인한 무한 리다이렉트 방지
          try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
          } catch (e) {
            console.error('[AuthInitializer] Failed to clear stale cookies:', e);
          }
          redirectToHomeIfUnauthenticated();
        }
      } catch (error) {
        console.error('[AuthInitializer] Session restoration error:', error);
        // 네트워크 오류 등으로 세션 복원 실패 시에도 쿠키 정리
        try {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (e) {
          // logout 호출도 실패하면 무시 (네트워크 완전 차단 상태)
        }
        redirectToHomeIfUnauthenticated();
      } finally {
        setInitialized(true);
      }
    }

    initializeAuth();
  }, [setAuth, setInitialized, router]); // ✅ Zustand 액션은 안정적인 참조

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const hasRefreshToken =
      typeof document !== 'undefined' && document.cookie.includes('refreshToken=');

    if (!hasRefreshToken && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const isProtectedRoute = PROTECTED_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      );

      if (isProtectedRoute) {
        router.replace(ROUTES.HOME);
      }
    }
  }, [isInitialized, router]);

  // 초기화 완료 전 로딩 표시 → 미인증 사용자가 보호 페이지를 볼 수 없도록 차단
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-400">세션 확인 중...</p>
        </div>
      </div>
    );
  }

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
