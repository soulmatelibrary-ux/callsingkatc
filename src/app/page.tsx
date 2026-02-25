'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Mail, Lock } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

// KAC 로고 SVG 컴포넌트
function KACLogo() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* 배경 원 */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>

      {/* KAC 텍스트 */}
      <g fill="white" fontSize="42" fontWeight="bold" fontFamily="Arial, sans-serif" textAnchor="middle" dominantBaseline="middle">
        <text x="50" y="45">KAC</text>
      </g>

      {/* 하단 한글 텍스트 */}
      <g fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif" textAnchor="middle">
        <text x="50" y="70">한국공항공사</text>
      </g>
    </svg>
  );
}

// 고퀄리티 이미지와 태스크 중심 슬로건을 활용한 신규 레이아웃
export default function Home() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const hasToken = document.cookie.includes('refreshToken=');
      if (!hasToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            const target = data.user.role === 'admin' ? ROUTES.ADMIN : ROUTES.AIRLINE;
            router.replace(target);
            return;
          }
        }
      } catch (error) {
        console.error('세션 확인 실패:', error);
      }

      setLoading(false);
    };

    checkSession();
  }, [router, setUser]);

  if (loading) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || '로그인 실패');
        setIsSubmitting(false);
        return;
      }

      const result = await response.json();

      // 전역 auth 상태 저장 (헤더/미들웨어와 일관성 유지)
      if (result.user && result.accessToken) {
        setAuth(result.user, result.accessToken);
      }

      // 역할 확인 및 라우팅
      if (isAdmin) {
        // 관리자 로그인
        if (result.user.role !== 'admin') {
          setError('관리자 계정이 아닙니다.');
          setIsSubmitting(false);
          return;
        }
        // 관리자 페이지: 유사호출부호 관리 대시보드
        router.push('/callsign-management');
      } else {
        // 항공사 로그인
        if (result.user.role === 'admin') {
          setError('일반 사용자 계정으로 로그인해주세요.');
          setIsSubmitting(false);
          return;
        }
        // 항공사 정보와 함께 /airline으로 이동
        router.push('/airline');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-[#030712] font-sans">
      {/* 프리미엄 배경 레이어 */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(3, 7, 18, 0.4), rgba(3, 7, 18, 0.6) 40%, rgba(3, 7, 18, 0.9) 100%),
            url('https://images.unsplash.com/photo-1542296332-2e4473faf563?q=80&w=2940&auto=format&fit=crop')
          `,
        }}
      />

      {/* 미세 그리드 오버레이 */}
      <div
        className="absolute inset-0 z-10 opacity-15 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#3b82f6 0.7px, transparent 0.7px)', backgroundSize: '40px 40px' }}
      />

      {/* 헤더 로고 */}
      <header className="absolute top-10 left-10 z-20 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center">
            <KACLogo />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white leading-none mb-1.5 uppercase flex items-center gap-2">
              <span>한국공항공사</span>
              <span className="text-white/40 font-medium">|</span>
              <span>항공교통본부</span>
            </h1>
            <p className="text-[10px] text-blue-400 font-bold tracking-[0.4em] leading-none uppercase">KAC Aviation Portal</p>
          </div>
        </div>
      </header>

      <main className="relative z-30 -top-[50px] w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-32 px-10 pb-20 lg:pb-32">

        {/* 왼쪽 메인 슬로건 영역 */}
        <div className="flex-1 text-left animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200 fill-mode-both lg:self-end">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-none bg-blue-500/10 border border-blue-400/20 mb-10">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest leading-none">실시간 영공 감시 중</span>
          </div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tighter mb-10 text-balance">
            대한민국 하늘의 안전,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">데이터가 연결합니다.</span>
          </h2>

          <p className="text-lg md:text-xl text-white/60 leading-relaxed font-medium mb-16 max-w-xl">
            차세대 항공 관제 및 유사호출부호 경보 시스템.<br />
            가장 정밀한 데이터 분석으로 안전한 비행 환경을 조성합니다.
          </p>

          <div className="flex gap-16 items-center">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white tracking-tighter">99.9%</span>
              <span className="text-[10px] font-bold text-white/30 tracking-[0.2em] mt-2 uppercase">Reliability</span>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white tracking-tighter">24Hrs</span>
              <span className="text-[10px] font-bold text-white/30 tracking-[0.2em] mt-2 uppercase">Monitoring</span>
            </div>
          </div>
        </div>

        {/* 오른쪽 로그인 영역 */}
        <div className="w-full max-w-[460px] animate-in fade-in slide-in-from-right-8 duration-1000 delay-400 fill-mode-both">
          <div className="bg-slate-900/75 backdrop-blur-[28px] rounded-none p-8 md:p-10 border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <div className="mb-8 text-center text-white/80">
                <span className="text-[11px] font-extrabold text-blue-400 uppercase tracking-[0.5em] block mb-3">Login System</span>
                <h3 className="text-4xl font-black text-white tracking-[0.2em] uppercase">LOGIN</h3>
              </div>

              {/* 탭 스타일 */}
              <div className="flex bg-black/40 p-1 rounded-none border border-white/5 mb-8 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setIsAdmin(false)}
                  className={`flex-1 py-3.5 rounded-none text-[13px] font-bold transition-all duration-300 ${!isAdmin ? 'bg-white/10 text-white border border-white/5 shadow-xl' : 'text-white/40 hover:text-white'}`}
                >
                  항공사 업무
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdmin(true)}
                  className={`flex-1 py-3.5 rounded-none text-[13px] font-bold transition-all duration-300 ${isAdmin ? 'bg-white/10 text-white border border-white/5 shadow-xl' : 'text-white/40 hover:text-white'}`}
                >
                  운영 관리자
                </button>
              </div>

              <form className="space-y-7" onSubmit={handleLogin}>
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-white/40 tracking-[0.1em] ml-2 uppercase">Account ID</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@kac.or.kr"
                      className="w-full pl-14 pr-6 py-3 bg-black/40 border border-white/5 rounded-none text-white placeholder-white/20 text-[17px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-black/60 transition-all shadow-inner"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-white/40 tracking-[0.1em] ml-2 uppercase">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-14 pr-6 py-3 bg-black/40 border border-white/5 rounded-none text-white placeholder-white/20 text-[17px] tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-black/60 transition-all font-mono shadow-inner"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-none text-xs font-bold animate-in fade-in zoom-in-95 duration-300">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center group cursor-pointer">
                    <input type="checkbox" className="hidden peer" />
                    <div className="w-5 h-5 rounded-none border border-white/10 bg-white/5 peer-checked:bg-blue-600 peer-checked:border-blue-500 flex items-center justify-center transition-all group-hover:bg-white/10">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="ml-3 text-[13px] font-semibold text-white/40 group-hover:text-white/70 transition-colors">로그인 상태 유지</span>
                  </label>
                  <Link href={ROUTES.FORGOT_PASSWORD} className="text-[13px] font-bold text-blue-400/90 hover:text-blue-300 transition-colors">계정 찾기</Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 mt-8 rounded-none text-base font-black text-white bg-blue-600 hover:bg-blue-500 shadow-2xl shadow-blue-600/30 active:scale-[0.98] transition-all tracking-[0.3em] uppercase ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'LOGGING IN...' : 'LOGIN'}
                </button>
              </form>

              <div className="mt-10 pt-8 border-t border-white/5 text-center">
                <p className="text-[11px] font-black text-white/30 tracking-[0.2em] uppercase leading-loose">
                  한국공항공사 <span className="text-white/10 mx-1">|</span> 항공교통본부
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 정보 */}
      <footer className="absolute bottom-12 left-12 right-12 z-20 flex justify-between items-end opacity-20 pointer-events-none hover:opacity-100 transition-opacity duration-300">
        <div className="flex gap-10 font-mono text-[10px] text-white/60 tracking-[0.2em] text-left uppercase">
          <div className="flex flex-col">
            <span className="text-white/30 mb-1">Sector</span>
            <span>RKRR / Incheon</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white/30 mb-1">Status</span>
            <span className="text-blue-400">Live Data Active</span>
          </div>
        </div>
        <div className="font-mono text-[10px] text-white/40 text-right tracking-widest uppercase">
          © 2026 KAC Portal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
