'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Plane, Building2, ShieldCheck, Mail, Lock } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

// 배경에 표시할 항공기 데이터 - 고정된 위치
const radarAircraft = [
  { airline: 'KAL', flight: 'KAL652', level: 'FL320', speed: '480kts', color: 'rgba(59, 130, 246, 0.7)', top: '10%', left: '10%', size: 16 },
  { airline: 'AAR', flight: 'AAR731', level: 'FL280', speed: '440kts', color: 'rgba(16, 185, 129, 0.6)', top: '35%', left: '15%', size: 15 },
  { airline: 'JJA', flight: 'JJA183', level: 'FL250', speed: '420kts', color: 'rgba(239, 68, 68, 0.5)', top: '25%', left: '25%', size: 13 },
  { airline: 'JNA', flight: 'JNA542', level: 'FL290', speed: '450kts', color: 'rgba(168, 85, 247, 0.6)', top: '55%', left: '20%', size: 14 },
  { airline: 'TWB', flight: 'TWB401', level: 'FL310', speed: '470kts', color: 'rgba(34, 197, 94, 0.55)', top: '60%', left: '35%', size: 14 },
  { airline: 'ABL', flight: 'ABL621', level: 'FL260', speed: '430kts', color: 'rgba(236, 72, 153, 0.5)', top: '40%', left: '50%', size: 12 },
  { airline: 'ASV', flight: 'ASV523', level: 'FL300', speed: '460kts', color: 'rgba(251, 146, 60, 0.6)', top: '5%', left: '45%', size: 13 },
  { airline: 'ESR', flight: 'ESR892', level: 'FL270', speed: '440kts', color: 'rgba(59, 130, 246, 0.55)', top: '70%', left: '40%', size: 12 },
  { airline: 'FGW', flight: 'FGW341', level: 'FL280', speed: '450kts', color: 'rgba(14, 165, 233, 0.6)', top: '15%', left: '55%', size: 13 },
  { airline: 'ARK', flight: 'ARK712', level: 'FL320', speed: '480kts', color: 'rgba(139, 92, 246, 0.5)', top: '50%', left: '25%', size: 12 },
  { airline: 'APZ', flight: 'APZ289', level: 'FL310', speed: '470kts', color: 'rgba(6, 182, 212, 0.6)', top: '20%', left: '30%', size: 14 },
];

// 항로 경로 데이터 (cubic bezier curves)
const flightRoutes = [
  { id: 'path1', pathD: 'M 10,80 Q 35,20 70,50 T 95,90', duration: 24 },
  { id: 'path2', pathD: 'M 85,10 Q 75,45 50,70 Q 25,85 15,60', duration: 22 },
  { id: 'path3', pathD: 'M 5,45 L 50,20 Q 80,40 60,85 L 25,75', duration: 20 },
  { id: 'path4', pathD: 'M 90,75 Q 65,50 40,55 Q 20,60 15,40', duration: 21 },
  { id: 'path5', pathD: 'M 30,90 Q 55,65 80,70 T 95,30', duration: 23 },
  { id: 'path6', pathD: 'M 100,50 L 75,15 Q 45,35 35,80 L 80,95', duration: 25 },
  { id: 'path7', pathD: 'M 20,20 Q 50,10 85,45 Q 70,75 35,70', duration: 19 },
  { id: 'path8', pathD: 'M 75,85 Q 50,70 25,50 L 20,15 L 55,25', duration: 22 },
  { id: 'path9', pathD: 'M 40,10 Q 65,30 70,70 Q 45,80 20,65', duration: 21 },
  { id: 'path10', pathD: 'M 95,20 L 70,45 Q 40,60 15,50 L 25,25', duration: 24 },
  { id: 'path11', pathD: 'M 10,30 Q 40,15 75,35 Q 85,65 50,85', duration: 20 },
];

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
            const target = data.user.role === 'admin' ? ROUTES.DASHBOARD : ROUTES.AIRLINE;
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
        body: JSON.stringify({
          email,
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
        // 관리자 첫 페이지는 대시보드
        router.push(ROUTES.DASHBOARD);
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        background: 'linear-gradient(135deg, #0a0f2c 0%, #1a1f4b 50%, #0d1b3d 100%)',
        padding: '20px',
        fontFamily: '"Pretendard Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Flight Routes Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          background: `
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
            linear-gradient(rgba(51, 65, 85, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(51, 65, 85, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 50px 50px, 50px 50px',
        }}
      >
        {/* SVG Flight Routes */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.5,
            pointerEvents: 'none',
            zIndex: 1,
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Flight route paths */}
          {flightRoutes.map((route) => (
            <path
              key={route.id}
              d={route.pathD}
              stroke="rgba(148, 163, 184, 0.3)"
              strokeWidth="0.5"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* Aircraft Blips - All 11 Airlines (Fixed Positions) */}
        {radarAircraft.map((aircraft, idx) => {
          return (
            <div
              key={idx}
              className="plane-blip"
              style={{
                position: 'absolute',
                left: aircraft.left,
                top: aircraft.top,
                pointerEvents: 'none',
                zIndex: 3,
              }}
            >
              <div style={{
                position: 'relative',
                transform: 'translate(-50%, -50%)',
              }}>
                <Plane
                  size={aircraft.size}
                  style={{
                    color: aircraft.color,
                    filter: `drop-shadow(0 0 8px ${aircraft.color.replace('0.', '0.').slice(0, -1)}1))`,
                  }}
                />
              </div>
              <div style={{
                position: 'absolute',
                left: '20px',
                top: '-10px',
                width: '120px',
                lineHeight: '1.3',
                color: 'rgba(229, 231, 235, 0.9)',
                fontSize: '9px',
                whiteSpace: 'nowrap',
              }}>
                <span style={{ display: 'block', fontWeight: '900' }}>{aircraft.flight}</span>
                <span style={{ display: 'block', opacity: '0.7', fontSize: '8px' }}>{aircraft.level} {aircraft.speed}</span>
              </div>
            </div>
          );
        })}

      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.5); }
        }

        /* Flight route animations for each aircraft */
        @keyframes followRoute0 {
          0% { left: 10%; top: 80%; }
          25% { left: 35%; top: 20%; }
          50% { left: 70%; top: 50%; }
          75% { left: 85%; top: 80%; }
          100% { left: 10%; top: 80%; }
        }
        @keyframes followRoute1 {
          0% { left: 85%; top: 10%; }
          25% { left: 75%; top: 45%; }
          50% { left: 50%; top: 70%; }
          75% { left: 25%; top: 85%; }
          100% { left: 85%; top: 10%; }
        }
        @keyframes followRoute2 {
          0% { left: 5%; top: 45%; }
          25% { left: 35%; top: 20%; }
          50% { left: 70%; top: 45%; }
          75% { left: 75%; top: 85%; }
          100% { left: 5%; top: 45%; }
        }
        @keyframes followRoute3 {
          0% { left: 90%; top: 75%; }
          25% { left: 65%; top: 50%; }
          50% { left: 40%; top: 55%; }
          75% { left: 20%; top: 60%; }
          100% { left: 90%; top: 75%; }
        }
        @keyframes followRoute4 {
          0% { left: 30%; top: 90%; }
          25% { left: 55%; top: 65%; }
          50% { left: 80%; top: 70%; }
          75% { left: 95%; top: 35%; }
          100% { left: 30%; top: 90%; }
        }
        @keyframes followRoute5 {
          0% { left: 100%; top: 50%; }
          25% { left: 75%; top: 20%; }
          50% { left: 45%; top: 35%; }
          75% { left: 35%; top: 80%; }
          100% { left: 100%; top: 50%; }
        }
        @keyframes followRoute6 {
          0% { left: 20%; top: 20%; }
          25% { left: 50%; top: 15%; }
          50% { left: 70%; top: 70%; }
          75% { left: 45%; top: 75%; }
          100% { left: 20%; top: 20%; }
        }
        @keyframes followRoute7 {
          0% { left: 75%; top: 85%; }
          25% { left: 50%; top: 70%; }
          50% { left: 25%; top: 50%; }
          75% { left: 20%; top: 20%; }
          100% { left: 75%; top: 85%; }
        }
        @keyframes followRoute8 {
          0% { left: 40%; top: 10%; }
          25% { left: 65%; top: 30%; }
          50% { left: 70%; top: 70%; }
          75% { left: 45%; top: 80%; }
          100% { left: 40%; top: 10%; }
        }
        @keyframes followRoute9 {
          0% { left: 95%; top: 20%; }
          25% { left: 70%; top: 45%; }
          50% { left: 40%; top: 60%; }
          75% { left: 25%; top: 25%; }
          100% { left: 95%; top: 20%; }
        }
        @keyframes followRoute10 {
          0% { left: 10%; top: 30%; }
          25% { left: 40%; top: 20%; }
          50% { left: 75%; top: 35%; }
          75% { left: 85%; top: 65%; }
          100% { left: 10%; top: 30%; }
        }

        .glass-card {
          backdrop-filter: blur(32px) saturate(180%);
          -webkit-backdrop-filter: blur(32px) saturate(180%);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(248, 249, 250, 0.88) 100%);
          border: 1px solid rgba(255, 255, 255, 0.5);
          animation: glow-pulse 3s ease-in-out infinite;
        }
        .plane-blip {
          filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.4));
        }
      `}</style>

      <div
        className="glass-card"
        style={{
          position: 'relative',
          zIndex: 10,
          borderRadius: '20px',
          padding: '32px 48px',
          width: '460px',
          maxWidth: '90vw',
          marginRight: '60px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
          animation: 'fadeIn 0.6s ease-out',
        }}
      >
        {/* 제목 */}
        <h2
          style={{
            fontSize: '24px',
            fontWeight: '900',
            marginBottom: '4px',
            color: '#0f172a',
            letterSpacing: '-0.02em',
          }}
        >
          유사호출부호 경고시스템
        </h2>

        {/* 부제목 */}
        <p
          style={{
            color: '#64748b',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '24px',
          }}
        >
          유사호출부호 경고시스템
        </p>

        <form onSubmit={handleLogin}>
          {/* 역할 선택 토글 */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', padding: '4px', background: 'rgba(241, 245, 249, 0.8)', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setIsAdmin(false)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px',
                border: 'none',
                background: !isAdmin ? '#ffffff' : 'transparent',
                color: !isAdmin ? '#2563eb' : '#64748b',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                boxShadow: !isAdmin ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none',
              }}
            >
              <Building2 size={16} />
              항공사
            </button>
            <button
              type="button"
              onClick={() => setIsAdmin(true)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px',
                border: 'none',
                background: isAdmin ? '#ffffff' : 'transparent',
                color: isAdmin ? '#2563eb' : '#64748b',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                boxShadow: isAdmin ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none',
              }}
            >
              <ShieldCheck size={16} />
              관리자
            </button>
          </div>

          {/* 이메일, 비밀번호 입력을 세로 배치 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>이메일</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width: '100%',
                    padding: '11px 16px 11px 40px',
                    border: '1.5px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>비밀번호</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '11px 16px 11px 40px',
                    border: '1.5px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          {/* 로그인 버튼과 하단 링크 */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 2,
                padding: '12px',
                background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              {isSubmitting ? '처리 중...' : '로그인'}
            </button>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
              <Link href={ROUTES.FORGOT_PASSWORD} style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700' }}>비밀번호 찾기</Link>
            </div>
          </div>
        </form>

        {/* 푸터 */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(226, 232, 240, 0.5)', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4', fontWeight: '600', marginBottom: '4px' }}>
            국토교통부 항공교통본부 · 유사호출부호 안전관리 시스템
          </p>
          <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
            한국공항공사 관리
          </p>
        </div>
      </div>
    </div>
  );
}
