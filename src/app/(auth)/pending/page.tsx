/**
 * 승인 대기 페이지
 * - TanStack Query로 30초마다 상태 폴링
 * - active가 되면 대시보드로 자동 이동
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { POLLING, ROUTES } from '@/lib/constants';

export default function PendingPage() {
  const router = useRouter();
  const { setUser, logout, accessToken } = useAuthStore((s) => ({
    setUser: s.setUser,
    logout: s.logout,
    accessToken: s.accessToken,
  }));

  async function getMeAPI() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers,
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }

  // 30초마다 내 정보 폴링
  const { data: user } = useQuery({
    queryKey: ['me', 'pending-poll', accessToken],
    queryFn: getMeAPI,
    refetchInterval: POLLING.PENDING_INTERVAL,
    refetchIntervalInBackground: false,
  });

  // 상태 변경 감지
  useEffect(() => {
    if (!user) return;

    if (user.status === 'active') {
      setUser(user);
      router.push(ROUTES.AIRLINE);
    }
  }, [user, setUser, router]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      logout();
      router.push(ROUTES.LOGIN);
    }
  }

  return (
    <div className="text-center space-y-6">
      {/* 애니메이션 아이콘 */}
      <div className="flex justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-amber-200 animate-ping opacity-50" />
          <div className="relative w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-200 flex items-center justify-center">
            <svg
              className="w-9 h-9 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">승인 대기 중</h1>
        <p className="mt-2 text-sm text-gray-600">
          관리자가 계정을 검토하고 있습니다.
          <br />
          승인되면 이 페이지에서 자동으로 이동됩니다.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-left space-y-1.5">
        <p className="text-xs font-semibold text-blue-800">안내사항</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>- 승인 처리는 영업일 기준 1-2일 내 완료됩니다.</li>
          <li>- 승인 완료 시 이메일로 통보됩니다.</li>
          <li>- 문의: katc-support@example.com</li>
        </ul>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
        <span>30초마다 자동으로 상태를 확인합니다</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="text-gray-400"
      >
        로그아웃
      </Button>
    </div>
  );
}
