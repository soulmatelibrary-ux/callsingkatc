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
import { NanoIcon } from '@/components/ui/NanoIcon';
import { Plane } from 'lucide-react';

// function PlaneIcon() removed, using NanoIcon instead

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
      // 쿠키 삭제 후 약간의 딜레이 제공
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch {
      // 서버 오류여도 클라이언트 상태는 초기화
    } finally {
      logout();
      // 로그인 페이지로 명확하게 이동
      router.push(ROUTES.LOGIN);
      // 페이지 새로고침으로 미들웨어 재실행
      router.refresh();
    }
  }

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-12 h-36 border-b-8 border-rose-700 overflow-hidden" // h-36 is 144px
      style={{
        background: 'linear-gradient(135deg, #00205b 0%, #003380 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      }}
    >
      {/* Grid effect for technical look */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Illustration (Tower Only) */}
      <div className="absolute left-[300px] bottom-0 h-full flex items-end justify-start opacity-40 pointer-events-none z-0">
        <svg viewBox="0 0 200 300" className="h-full">
          <g transform="translate(50, 110)" fill="#fff" style={{ filter: 'drop-shadow(0 0 10px rgba(100, 200, 255, 0.4))' }}>
            <rect x="40" y="100" width="30" height="160" opacity="0.4" />
            <rect x="35" y="85" width="40" height="20" rx="1" opacity="0.6" />
            <path d="M20,85 L90,85 L80,45 L30,45 Z" />
            <rect x="25" y="45" width="60" height="8" fill="rgba(34, 211, 238, 0.3)" />
            <rect x="52" y="10" width="6" height="35" />
            <circle cx="55" cy="5" r="2" />
          </g>
        </svg>
      </div>

      {/* 로고 + 시스템명 + 항공사 정보 */}
      <div className="flex items-center gap-6 z-10">
        {/* 로고 아이콘 */}
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-md">
          <NanoIcon icon={Plane} color="info" size="md" />
        </div>

        {/* 시스템명 */}
        <Link
          href={ROUTES.HOME}
          className="flex flex-col text-white hover:opacity-90 transition-opacity"
        >
          <span className="text-white font-black text-3xl leading-tight tracking-tighter">
            유사호출부호 경고시스템
          </span>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.4em]">KAC Aviation Safety Portal</p>
          </div>
        </Link>

        {/* 항공사/기관 정보 */}
        {isAuthenticated && user && (
          <div className="flex flex-col justify-center ml-10 pl-10 border-l border-white/15">
            <span
              className="text-emerald-400 font-black text-2xl tracking-tighter"
              style={{ color: isAdmin ? '#FFFFFF' : getAirlineTextColor(user.airline?.code) }}
            >
              {isAdmin ? '항공교통본부' : (user.airline?.name_en || user.airline?.name_ko)}
            </span>
            {!isAdmin && user.airline?.name_ko && (
              <span className="text-white/40 text-xs font-bold -mt-1 uppercase tracking-widest">{user.airline.name_ko}</span>
            )}
            {isAdmin && (
              <span className="text-white/40 text-xs font-bold -mt-1 uppercase tracking-widest">ATMB</span>
            )}
          </div>
        )}
      </div>

      {/* 우측 영역 */}
      <nav className="flex items-end gap-8 z-10" aria-label="사용자 네비게이션">
        {isAuthenticated && user ? (
          <>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
              </div>
              <span className="text-white/70 text-[10px] font-bold tracking-wide uppercase">
                {user.email}
              </span>
            </div>

            {/* 유사호출부호 관리 (관리자만) */}
            {isAdmin && (
              <Link
                href={ROUTES.CALLSIGN_MANAGEMENT}
                className="pb-2 text-white/60 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-none transition-all"
              >
                유사호출부호
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin/users?tab=users"
                className="px-5 py-1.5 bg-white/20 text-white text-[11px] font-black uppercase tracking-widest rounded-none border border-white/20 hover:bg-white/30 transition-all"
              >
                관리자 페이지
              </Link>
            )}

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_4px_10px_rgba(225,29,72,0.2)] active:scale-95 border border-rose-500/50"
              type="button"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            href={ROUTES.LOGIN}
            className="px-8 py-3 text-white text-xs font-black uppercase tracking-widest rounded-none bg-white/10 hover:bg-white/20 transition-all border border-white/20 backdrop-blur-md shadow-lg"
          >
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
