'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Plane, Building2, ShieldCheck, Mail, Lock } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

const airlines = [
  { code: 'KAL', name: '대한항공 (KAL)' },
  { code: 'AAR', name: '아시아나항공 (AAR)' },
  { code: 'JJA', name: '제주항공 (JJA)' },
  { code: 'JNA', name: '진에어 (JNA)' },
  { code: 'TWB', name: '티웨이항공 (TWB)' },
  { code: 'ABL', name: '에어부산 (ABL)' },
  { code: 'ASV', name: '에어서울 (ASV)' },
  { code: 'ESR', name: '이스타항공 (ESR)' },
  { code: 'FGW', name: '플라이강원 (FGW)' },
  { code: 'ARK', name: '에어로케이항공 (ARK)' },
  { code: 'APZ', name: '에어프레미아 (APZ)' },
];

// 배경에 표시할 항공기 데이터 (인천 FIR 내부)
const radarAircraft = [
  { airline: 'KAL', flight: 'KAL652', level: 'FL320', speed: '480kts', top: '30%', left: '35%', color: 'rgba(59, 130, 246, 0.7)', rotation: 35, size: 16 },
  { airline: 'AAR', flight: 'AAR731', level: 'FL280', speed: '440kts', top: '50%', left: '28%', color: 'rgba(16, 185, 129, 0.6)', rotation: 210, size: 15 },
  { airline: 'JJA', flight: 'JJA183', level: 'FL250', speed: '420kts', top: '40%', left: '40%', color: 'rgba(239, 68, 68, 0.5)', rotation: 120, size: 13 },
  { airline: 'JNA', flight: 'JNA542', level: 'FL290', speed: '450kts', top: '35%', left: '45%', color: 'rgba(168, 85, 247, 0.6)', rotation: 90, size: 14 },
  { airline: 'TWB', flight: 'TWB401', level: 'FL310', speed: '470kts', top: '55%', left: '35%', color: 'rgba(34, 197, 94, 0.55)', rotation: 180, size: 14 },
  { airline: 'ABL', flight: 'ABL621', level: 'FL260', speed: '430kts', top: '45%', left: '50%', color: 'rgba(236, 72, 153, 0.5)', rotation: 45, size: 12 },
  { airline: 'ASV', flight: 'ASV523', level: 'FL300', speed: '460kts', top: '25%', left: '42%', color: 'rgba(251, 146, 60, 0.6)', rotation: 270, size: 13 },
  { airline: 'ESR', flight: 'ESR892', level: 'FL270', speed: '440kts', top: '60%', left: '40%', color: 'rgba(59, 130, 246, 0.55)', rotation: 150, size: 12 },
  { airline: 'FGW', flight: 'FGW341', level: 'FL280', speed: '450kts', top: '32%', left: '48%', color: 'rgba(14, 165, 233, 0.6)', rotation: 60, size: 13 },
  { airline: 'ARK', flight: 'ARK712', level: 'FL320', speed: '480kts', top: '52%', left: '33%', color: 'rgba(139, 92, 246, 0.5)', rotation: 225, size: 12 },
  { airline: 'APZ', flight: 'APZ289', level: 'FL310', speed: '470kts', top: '38%', left: '38%', color: 'rgba(6, 182, 212, 0.6)', rotation: 315, size: 14 },
];

export default function Home() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState<string>('KAL');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const hasToken = document.cookie.includes('refreshToken=');
    if (hasToken) {
      router.push('/airline');
    } else {
      setLoading(false);
    }
  }, [router]);

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
        // 관리자 첫 페이지는 관리자 대시보드
        router.push('/admin');
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
      {/* Incheon FIR Map Background */}
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
        {/* Incheon FIR Map */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '65%',
            height: '100%',
            opacity: 0.65,
            pointerEvents: 'none',
            zIndex: 2,
          }}
          viewBox="0 0 450 550"
          preserveAspectRatio="xMinYMid slice"
        >
          {/* 인천 FIR boundary - Actual boundary based on reference image */}
          <path
            d="M 80 80 L 240 80 L 320 120 Q 340 150 330 200 L 320 280 Q 310 320 280 350 L 200 380 L 120 370 Q 90 360 80 320 L 70 200 Q 75 140 80 80 Z"
            fill="rgba(220, 38, 38, 0.12)"
            stroke="rgba(220, 38, 38, 0.85)"
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Korea mainland silhouette (very subtle) */}
          <path
            d="M 120 180 Q 140 200 150 220 Q 160 250 150 280 Q 140 300 120 310 L 120 180 Z"
            fill="rgba(148, 163, 184, 0.15)"
            stroke="none"
          />

          {/* Incheon Airport (ICN) - Center marker */}
          <circle cx="170" cy="220" r="7" fill="rgba(220, 38, 38, 0.9)" />
          <circle cx="170" cy="220" r="14" fill="none" stroke="rgba(220, 38, 38, 0.5)" strokeWidth="2" />
          <text x="170" y="255" fontSize="12" fill="rgba(220, 38, 38, 0.85)" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">
            ICN
          </text>

          {/* FIR Title */}
          <text x="200" y="50" fontSize="32" fill="rgba(220, 38, 38, 0.9)" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">
            인천 FIR
          </text>

          {/* Coordinate grid (very subtle) */}
          <line x1="80" y1="100" x2="340" y2="100" stroke="rgba(220, 38, 38, 0.08)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="80" y1="150" x2="340" y2="150" stroke="rgba(220, 38, 38, 0.08)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="80" y1="200" x2="340" y2="200" stroke="rgba(220, 38, 38, 0.08)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="80" y1="250" x2="340" y2="250" stroke="rgba(220, 38, 38, 0.08)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="80" y1="300" x2="340" y2="300" stroke="rgba(220, 38, 38, 0.08)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="80" y1="350" x2="340" y2="350" stroke="rgba(220, 38, 38, 0.08)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="120" y1="80" x2="120" y2="370" stroke="rgba(220, 38, 38, 0.08)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="180" y1="80" x2="180" y2="370" stroke="rgba(220, 38, 38, 0.08)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="240" y1="80" x2="240" y2="370" stroke="rgba(220, 38, 38, 0.08)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="300" y1="80" x2="300" y2="370" stroke="rgba(220, 38, 38, 0.08)" strokeWidth="1" strokeDasharray="4,4" />
        </svg>


        {/* Aircraft Blips - All 11 Airlines */}
        {radarAircraft.map((aircraft, idx) => {
          // Assign different movement animations to create natural flight patterns
          const animations = ['moveX', 'moveY', 'moveXReverse', 'moveYReverse'];
          const selectedAnimation = animations[idx % animations.length];
          const duration = 2.5 + idx * 0.3;
          const delay = idx * 0.2;

          return (
          <div
            key={idx}
            className="plane-blip"
            style={{
              position: 'absolute',
              top: aircraft.top,
              left: aircraft.left,
              color: aircraft.color,
              fontSize: '10px',
              pointerEvents: 'none',
              zIndex: 3,
              animation: `${selectedAnimation} ${duration}s ease-in-out infinite ${delay}s, blink ${duration}s ease-in-out infinite ${delay}s`
            }}
          >
            <Plane
              size={aircraft.size}
              style={{
                transform: `rotate(${aircraft.rotation}deg)`,
                filter: `drop-shadow(0 0 ${6 + idx}px ${aircraft.color.replace('0.', '0.').slice(0, -1)}1))`,
                transition: 'transform 0.3s ease'
              }}
            />
            <div style={{
              position: 'absolute',
              left: `${18 + idx}px`,
              top: '0',
              width: `${90 + idx * 5}px`,
              lineHeight: '1.3',
              color: 'rgba(229, 231, 235, 0.9)',
              fontSize: '9px'
            }}>
              <span style={{ display: 'block', fontWeight: '900' }}>{aircraft.flight}</span>
              <span style={{ display: 'block', opacity: '0.7', fontSize: '8px' }}>{aircraft.level} {aircraft.speed}</span>
            </div>
          </div>
          );
        })}

      </div>

      <style jsx global>{`
        @keyframes rotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.5); }
        }
        @keyframes moveX {
          0% { transform: translateX(-50px); opacity: 0.5; }
          50% { opacity: 1; }
          100% { transform: translateX(50px); opacity: 0.5; }
        }
        @keyframes moveXReverse {
          0% { transform: translateX(50px); opacity: 0.5; }
          50% { opacity: 1; }
          100% { transform: translateX(-50px); opacity: 0.5; }
        }
        @keyframes moveY {
          0% { transform: translateY(-40px); opacity: 0.5; }
          50% { opacity: 1; }
          100% { transform: translateY(40px); opacity: 0.5; }
        }
        @keyframes moveYReverse {
          0% { transform: translateY(40px); opacity: 0.5; }
          50% { opacity: 1; }
          100% { transform: translateY(-40px); opacity: 0.5; }
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
        @keyframes blink {
          0%, 100% { transform: scale(0.95); }
          50% { transform: scale(1.1); }
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
        {/* 로고 영역 */}
        <div style={{
          display: 'inline-flex',
          padding: '6px 14px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.95)',
          marginBottom: '16px',
          boxShadow: '0 8px 15px -3px rgba(0, 0, 0, 0.1)',
        }}>
          <img src="/logo_kac.png" alt="KAC Logo" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
        </div>

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
          Similar Callsign Warning System
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

          {/* 항공사 선택, 이메일, 비밀번호 입력을 세로 배치 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {!isAdmin && (
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>항공사</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedAirline}
                    onChange={(e) => setSelectedAirline(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      border: '1.5px solid rgba(226, 232, 240, 0.8)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      background: '#ffffff',
                      appearance: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {airlines.map((airline) => (
                      <option key={airline.code} value={airline.code}>{airline.name}</option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
                    ▼
                  </div>
                </div>
              </div>
            )}

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
