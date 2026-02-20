'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

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

export default function Home() {
  const router = useRouter();
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

      // 역할 확인
      if (isAdmin) {
        // 관리자 로그인
        if (result.user.role !== 'admin') {
          setError('관리자 계정이 아닙니다.');
          setIsSubmitting(false);
          return;
        }
        router.push('/admin/users');
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
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        padding: '20px',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '48px 40px',
          width: '420px',
          maxWidth: '90vw',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          textAlign: 'center',
        }}
      >
        {/* 로고 */}
        <div style={{ fontSize: '42px', marginBottom: '16px' }}>✈️</div>

        {/* 제목 */}
        <h2
          style={{
            fontSize: '22px',
            fontWeight: '800',
            marginBottom: '6px',
            color: '#1a1d23',
          }}
        >
          유사호출부호 경고시스템
        </h2>

        {/* 부제목 */}
        <p
          style={{
            color: '#5a6170',
            fontSize: '14px',
            marginBottom: '28px',
          }}
        >
          항공사 전용 — 사후분석 및 조치관리
        </p>

        <form onSubmit={handleLogin}>
          {/* 역할 선택 토글 */}
          <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsAdmin(false)}
              style={{
                flex: 1,
                padding: '10px',
                border: '1.5px solid',
                borderColor: !isAdmin ? '#2563eb' : '#e2e5ea',
                background: !isAdmin ? '#dbeafe' : '#fff',
                color: !isAdmin ? '#2563eb' : '#5a6170',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              항공사
            </button>
            <button
              type="button"
              onClick={() => setIsAdmin(true)}
              style={{
                flex: 1,
                padding: '10px',
                border: '1.5px solid',
                borderColor: isAdmin ? '#2563eb' : '#e2e5ea',
                background: isAdmin ? '#dbeafe' : '#fff',
                color: isAdmin ? '#2563eb' : '#5a6170',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              관리자
            </button>
          </div>

          {/* 항공사 선택 (항공사 로그인일 때만) */}
          {!isAdmin && (
            <div style={{ marginBottom: '18px', textAlign: 'left' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#5a6170',
                  marginBottom: '6px',
                }}
              >
                항공사 선택
              </label>
              <select
                value={selectedAirline}
                onChange={(e) => setSelectedAirline(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1.5px solid #e2e5ea',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: '#fff',
                  cursor: 'pointer',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e5ea')}
              >
                {airlines.map((airline) => (
                  <option key={airline.code} value={airline.code}>
                    {airline.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 이메일 입력 */}
          <div style={{ marginBottom: '18px', textAlign: 'left' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#5a6170',
                marginBottom: '6px',
              }}
            >
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #e2e5ea',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e5ea')}
              required
            />
          </div>

          {/* 비밀번호 입력 */}
          <div style={{ marginBottom: '18px', textAlign: 'left' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#5a6170',
                marginBottom: '6px',
              }}
            >
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #e2e5ea',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e5ea')}
              required
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div
              style={{
                background: '#fef2f2',
                color: '#dc2626',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              background: isSubmitting ? '#9ca3af' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              marginTop: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) e.currentTarget.style.background = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) e.currentTarget.style.background = '#2563eb';
            }}
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 하단 텍스트 */}
        <div
          style={{
            marginTop: '20px',
            fontSize: '12px',
            color: '#8b92a0',
          }}
        >
          국토교통부 항공교통본부 · 유사호출부호 안전관리 시스템
        </div>
      </div>
    </div>
  );
}
