/**
 * Header 컴포넌트
 * - airline.html .top-bar 스타일 참고
 * - 비로그인: 로그인 버튼
 * - 로그인됨: 사용자 이메일 + 대시보드 링크
 * - 관리자: "관리자 페이지" 추가 링크
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/lib/constants';
import { parseJsonCookie } from '@/lib/cookies';

function PlaneIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  );
}

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout, fetchUserInfo } = useAuthStore((s) => ({
    user: s.user,
    isAuthenticated: s.isAuthenticated(),
    isAdmin: s.isAdmin(),
    logout: s.logout,
    fetchUserInfo: s.fetchUserInfo,
  }));

  // 새로고침 시 서버에서 사용자 정보 가져오기 (단일 진실의 소스)
  useEffect(() => {
    if (!user) {
      fetchUserInfo();
    }
  }, [user, fetchUserInfo]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // 서버 오류여도 클라이언트 상태는 초기화
    } finally {
      logout();
      router.push(ROUTES.HOME);
    }
  }

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}
    >
      {/* 로고 + 시스템명 */}
      <div className="flex items-center gap-2">
        <span className="text-white" aria-hidden="true">
          <PlaneIcon />
        </span>
        <Link
          href={ROUTES.HOME}
          className="text-white font-bold text-base tracking-tight hover:opacity-90 transition-opacity"
        >
          KATC 유사호출부호 경고시스템
        </Link>
      </div>

      {/* 우측 영역 */}
      <nav className="flex items-center gap-2" aria-label="사용자 네비게이션">
        {isAuthenticated && user ? (
          <>
            {/* 사용자 이메일 표시 */}
            <span className="hidden sm:inline-block text-white/80 text-xs px-3 py-1 rounded-full bg-white/10">
              {user.email}
            </span>

            {/* 대시보드 링크
                - 관리자: /dashboard (관리자 대시보드)
                - 일반 사용자: /airline (항공사 메인 대시보드)
            */}
            <Link
              href={isAdmin ? ROUTES.DASHBOARD : ROUTES.AIRLINE}
              className="px-3 py-1.5 text-white text-sm font-medium rounded-md bg-white/15 hover:bg-white/25 transition-colors"
            >
              대시보드
            </Link>

            {/* 관리자 전용 링크: 현재 관리자 메인 페이지 */}
            {isAdmin && (
              <Link
                href={ROUTES.ADMIN}
                className="px-3 py-1.5 text-white text-sm font-medium rounded-md bg-white/15 hover:bg-white/25 transition-colors"
              >
                관리자 페이지
              </Link>
            )}

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-white text-sm font-medium rounded-md bg-red-500/30 hover:bg-red-500/50 transition-colors"
              type="button"
            >
              로그아웃
            </button>
          </>
        ) : (
          <Link
            href={ROUTES.LOGIN}
            className="px-4 py-1.5 text-white text-sm font-semibold rounded-md bg-white/15 hover:bg-white/25 transition-colors border border-white/20"
          >
            로그인
          </Link>
        )}
      </nav>
    </header>
  );
}
