'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { authStore } from '@/store/authStore';
import { apiFetch } from '@/lib/api/client';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: 0 },
        },
      })
  );

  // Option 4: 비활동 감시 및 토큰 만료 체크
  useEffect(() => {
    // 1️⃣ 사용자 활동 감시 (click, scroll, keypress)
    const handleActivity = () => {
      authStore.getState().recordActivity();
    };

    // 이벤트 리스너 등록
    const events = ['click', 'scroll', 'keypress', 'mousemove'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // 2️⃣ 주기적으로 비활동 시간 체크 (1분마다)
    const inactivityCheckInterval = setInterval(() => {
      const authState = authStore.getState();

      // 비활동 30분 확인
      if (authState.isAuthenticated() && authState.checkInactivity()) {
        console.warn('[SessionManager] 30분 비활동으로 로그아웃합니다.');
        authState.logout();
      }

      // 토큰 만료 확인 및 갱신
      // 토큰이 곧 만료되면 apiFetch('/api/auth/me')를 호출
      // → apiFetch가 401 에러를 받고 자동으로 토큰 갱신함 (뮤텍스 사용)
      if (authState.isAuthenticated()) {
        const isTokenValid = authState.checkTokenExpiry();
        if (!isTokenValid) {
          // 토큰 만료됨: apiFetch로 갱신 트리거
          apiFetch('/api/auth/me', { method: 'GET' }).catch(() => {
            // 갱신 실패 시 apiFetch에서 자동으로 로그아웃 처리됨
          });
        }
      }
    }, 60 * 1000); // 1분마다 실행

    // 3️⃣ 정리
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(inactivityCheckInterval);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
