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

// 항공사별 시그니쳐 색상 (파란 배경에서 색 대비 고려)
function getAirlineTextColor(airlineCode?: string): string {
  const colorMap: Record<string, string> = {
    KAL: '#FFFFFF', // 대한항공: 흰색 (파란색 배경에서 대비 부족)
    AAR: '#FFFFFF', // 아시아나: 흰색 (파란색 배경에서 대비 부족)
    JJA: '#FF6600', // 제주항공: 주황색 (색 대비 좋음)
    JNA: '#FFD700', // 진에어: 노란색 (색 대비 좋음)
    TWB: '#E31937', // 티웨이: 빨간색 (색 대비 좋음)
    ABL: '#FFFFFF', // 에어부산: 흰색 (파란색 배경에서 대비 부족)
    ASV: '#1BC47D', // 에어서울: 초록색 (색 대비 좋음)
    EOK: '#E31937', // 이스타: 빨간색 (색 대비 좋음)
    FGW: '#FFFFFF', // 플라이강원: 흰색 (파란색 배경에서 대비 부족)
  };
  return colorMap[airlineCode || ''] || '#FFFFFF';
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

  // 페이지 로드 시 서버에서 최신 사용자 정보 가져오기 (단일 진실의 소스)
  // isAuthenticated가 변경될 때마다 최신 정보 갱신
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserInfo();
    }
  }, [isAuthenticated, fetchUserInfo]);

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
      className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b-4 border-rose-700" // py-3 -> py-4, thin red border added
      style={{
        backgroundColor: '#00205b', // KAC Dark Navy
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      }}
    >
      {/* 로고 + 시스템명 + 항공사 정보 */}
      <div className="flex items-center gap-3">
        {/* 로고 아이콘 */}
        <span className="text-white p-2 bg-white/10 rounded-full shadow-lg" aria-hidden="true">
          <PlaneIcon />
        </span>

        {/* 시스템명 */}
        <Link
          href={ROUTES.HOME}
          className="flex items-baseline gap-2 text-white hover:opacity-90 transition-opacity"
        >
          <span className="text-white font-extrabold text-lg leading-tight tracking-tight">
            유사호출부호 경고시스템
          </span>
        </Link>

        {/* 항공사/기관 정보 */}
        {isAuthenticated && user && (
          <div className="flex flex-col justify-center ml-4 pl-4 border-l border-white/20">
            <span
              className="font-extrabold text-lg leading-tight tracking-tight"
              style={{ color: isAdmin ? '#FFFFFF' : getAirlineTextColor(user.airline?.code) }}
            >
              {isAdmin ? '항공교통본부' : (user.airline?.name_en ? `${user.airline.name_en} ${user.airline.name_ko}` : user.airline?.name_ko)}
            </span>
          </div>
        )}
      </div>

      {/* 우측 영역 */}
      <nav className="flex items-center gap-3" aria-label="사용자 네비게이션">
        {isAuthenticated && user ? (
          <>
            {/* 사용자 이메일 표시 */}
            <span className="hidden md:inline-block text-white/90 text-[11px] font-bold px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/5">
              {user.email}
            </span>

            {!isAdmin && (
              <Link
                href={ROUTES.ANNOUNCEMENTS}
                className="px-4 py-2 text-white/90 hover:text-white text-sm font-bold rounded-none transition-all"
              >
                📢 공지사항
              </Link>
            )}

            {isAdmin && (
              <div className="flex bg-black/10 p-1 rounded-none backdrop-blur-sm">
                <Link
                  href={ROUTES.ANNOUNCEMENTS}
                  className="px-4 py-2 text-white/70 hover:text-white text-sm font-bold rounded-none transition-all"
                >
                  공지사항
                </Link>
                <Link
                  href={ROUTES.DASHBOARD}
                  className="px-4 py-2 text-white/70 hover:text-white text-sm font-bold rounded-none transition-all"
                >
                  유사호출부호 관리
                </Link>
                <Link
                  href={ROUTES.ADMIN}
                  className="px-4 py-2 bg-white/20 text-white text-sm font-extrabold rounded-none shadow-sm"
                >
                  관리자 페이지
                </Link>
              </div>
            )}

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-white/90 text-sm font-bold rounded-none bg-red-500/20 hover:bg-red-500/40 border border-red-500/20 transition-all ml-1"
              type="button"
            >
              로그아웃
            </button>
          </>
        ) : (
          <Link
            href={ROUTES.LOGIN}
            className="px-6 py-2 text-white text-sm font-extrabold rounded-none bg-white/10 hover:bg-white/20 transition-all border border-white/20 backdrop-blur-md shadow-lg"
          >
            로그인
          </Link>
        )}
      </nav>
    </header>
  );
}
