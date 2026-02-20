'use client';

import { Header } from '@/components/layout/Header';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { parseJsonCookie } from '@/lib/cookies';

const AL: Record<string, { n: string }> = {
  KAL: { n: '대한항공' },
  AAR: { n: '아시아나항공' },
  JJA: { n: '제주항공' },
  JNA: { n: '진에어' },
  TWB: { n: '티웨이항공' },
  ABL: { n: '에어부산' },
  ASV: { n: '에어서울' },
  ESR: { n: '이스타항공' },
  FGW: { n: '플라이강원' },
  ARK: { n: '에어로케이항공' },
  APZ: { n: '에어프레미아' },
};

interface CookieUser {
  airline?: {
    code?: string;
    name_ko?: string;
  };
}

const INC = [
  { id: 'I01', pair: 'KAL852 | KAL851', mine: 'KAL852', other: 'KAL851', airline: 'KAL', errorType: '관제사 오류', subError: '복창오류', risk: '매우높음', similarity: '매우높음', count: 4, lastDate: '2026-02-13', dates: ['02-13 14:20', '02-11 09:15', '02-08 16:40', '02-05 11:30'] },
  { id: 'I02', pair: 'KAL789 | AAR789', mine: 'KAL789', other: 'AAR789', airline: 'KAL', errorType: '관제사 오류', subError: '무응답/재호출', risk: '높음', similarity: '높음', count: 2, lastDate: '2026-02-12', dates: ['02-12 10:45', '02-07 15:20'] },
  { id: 'I03', pair: 'KAL456 | AAR456', mine: 'KAL456', other: 'AAR456', airline: 'KAL', errorType: '조종사 오류', subError: '고도이탈', risk: '매우높음', similarity: '높음', count: 4, lastDate: '2026-02-11', dates: ['02-11 08:30', '02-09 13:10', '02-06 17:00', '02-03 09:45'] },
  { id: 'I04', pair: 'KAL1203 | KAL1230', mine: 'KAL1203', other: 'KAL1230', airline: 'KAL', errorType: '조종사 오류', subError: '비행경로이탈', risk: '높음', similarity: '높음', count: 2, lastDate: '2026-02-10', dates: ['02-10 16:00', '02-04 11:20'] },
  { id: 'I05', pair: 'KAL672 | JJA672', mine: 'KAL672', other: 'JJA672', airline: 'KAL', errorType: '관제사 오류', subError: '복창오류', risk: '높음', similarity: '높음', count: 1, lastDate: '2026-02-09', dates: ['02-09 18:20'] },
  { id: 'I06', pair: 'KAL305 | TWB305', mine: 'KAL305', other: 'TWB305', airline: 'KAL', errorType: '오류 미발생', subError: '', risk: '낮음', similarity: '낮음', count: 0, lastDate: '2026-02-08', dates: [] },
  { id: 'I07', pair: 'KAL118 | JNA118', mine: 'KAL118', other: 'JNA118', airline: 'KAL', errorType: '오류 미발생', subError: '', risk: '낮음', similarity: '낮음', count: 0, lastDate: '2026-02-06', dates: [] },
  { id: 'I08', pair: 'AAR789 | AAR798', mine: 'AAR789', other: 'AAR798', airline: 'AAR', errorType: '관제사 오류', subError: '복창오류', risk: '매우높음', similarity: '매우높음', count: 3, lastDate: '2026-02-14', dates: ['02-14 11:30', '02-12 14:20', '02-10 09:15'] },
  { id: 'I09', pair: 'AAR456 | KAL456', mine: 'AAR456', other: 'KAL456', airline: 'AAR', errorType: '조종사 오류', subError: '고도이탈', risk: '높음', similarity: '높음', count: 2, lastDate: '2026-02-13', dates: ['02-13 16:00', '02-08 10:45'] },
  { id: 'I10', pair: 'JJA672 | KAL672', mine: 'JJA672', other: 'KAL672', airline: 'JJA', errorType: '관제사 오류', subError: '무응답/재호출', risk: '높음', similarity: '높음', count: 1, lastDate: '2026-02-12', dates: ['02-12 13:50'] },
];

export default function AirlinePage() {
  const router = useRouter();
  const [airlineCode, setAirlineCode] = useState<string>('');
  const [airlineName, setAirlineName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incidents');
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    console.log('🔄 airline/page useEffect 실행됨');

    // refreshToken은 httpOnly라서 user 쿠키 존재 여부로 로그인 상태를 확인한다
    const userCookie = document.cookie
      .split(';')
      .find(c => c.trim().startsWith('user='));

    console.log('📍 userCookie 발견:', !!userCookie);

    const userData = parseJsonCookie<CookieUser>(userCookie);

    if (!userData) {
      console.log('❌ 사용자 정보 파싱 실패 - 로그인 페이지로 이동');
      router.push('/login');
      return;
    }

    let code = userData.airline?.code || '';
    let name = userData.airline?.name_ko || '';

    if (!code) {
      code = 'KAL';
      name = '대한항공';
      console.log('📍 기본값 사용');
    }

    if (!name && code) {
      name = AL[code]?.n || '';
    }

    console.log('📍 최종 항공사:', code, name);

    setAirlineCode(code);
    setAirlineName(name);
    const filtered = INC.filter(i => i.airline === code);
    console.log('✅ 필터링된 데이터:', filtered);
    setIncidents(filtered);
    console.log('✅ 로딩 완료 - setLoading(false) 호출');
    setLoading(false);
  }, [router]);

  const riskColor: Record<string, string> = {
    '매우높음': '#dc2626',
    '높음': '#f59e0b',
    '낮음': '#16a34a',
    '매우낮음': '#0891b2',
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-gray-600">로딩 중...</div>
        </div>
      </>
    );
  }

  const atcCount = incidents.filter(i => i.errorType === '관제사 오류').length;
  const pilotCount = incidents.filter(i => i.errorType === '조종사 오류').length;
  const noneCount = incidents.filter(i => i.errorType === '오류 미발생').length;
  const total = incidents.length;

  return (
    <>
      <Header />
      <div style={{ paddingTop: '64px', minHeight: '100vh', background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}>
        {/* 상단 정보 */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '32px' }}>✈️</span>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a5f', margin: '0 0 6px 0' }}>{airlineName} - 유사호출부호 경고시스템</h1>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0' }}>항공사 전용 · 사후분석 및 조치관리</p>
              </div>
            </div>
            <div style={{ textAlign: 'right', color: '#6b7280', fontSize: '13px' }}>
              {new Date().toLocaleDateString('ko-KR')}
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', paddingLeft: '32px', paddingRight: '32px' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            <button
              onClick={() => setActiveTab('incidents')}
              style={{
                padding: '16px 0',
                borderBottom: activeTab === 'incidents' ? '2px solid #2563eb' : '2px solid transparent',
                fontSize: '14px',
                fontWeight: '600',
                color: activeTab === 'incidents' ? '#2563eb' : '#6b7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
            >
              📊 유사호출부호 발생현황
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              style={{
                padding: '16px 0',
                borderBottom: activeTab === 'actions' ? '2px solid #2563eb' : '2px solid transparent',
                fontSize: '14px',
                fontWeight: '600',
                color: activeTab === 'actions' ? '#2563eb' : '#6b7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
            >
              📋 조치 이력
            </button>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
          {activeTab === 'incidents' && (
            <>
              {/* 통계 요약 섹션 */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>
                  🎯 오류유형 요약
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', padding: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#742a2a', fontWeight: '600', marginBottom: '8px' }}>관제사오류</div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626' }}>{atcCount}</div>
                    <div style={{ fontSize: '12px', color: '#a16061', marginTop: '6px' }}>전체의 {total > 0 ? Math.round((atcCount / total) * 100) : 0}%</div>
                  </div>
                  <div style={{ background: '#fffbf0', border: '1px solid #fed7aa', borderRadius: '8px', padding: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#7c2d12', fontWeight: '600', marginBottom: '8px' }}>조종사오류</div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#f97316' }}>{pilotCount}</div>
                    <div style={{ fontSize: '12px', color: '#a16207', marginTop: '6px' }}>전체의 {total > 0 ? Math.round((pilotCount / total) * 100) : 0}%</div>
                  </div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#15803d', fontWeight: '600', marginBottom: '8px' }}>오류 미발생</div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#16a34a' }}>{noneCount}</div>
                    <div style={{ fontSize: '12px', color: '#4b7c5e', marginTop: '6px' }}>전체의 {total > 0 ? Math.round((noneCount / total) * 100) : 0}%</div>
                  </div>
                </div>
              </div>

              {/* 오류 분포 섹션 */}
              {total > 0 && (
                <div style={{ marginBottom: '32px', background: '#ffffff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>
                    📊 세부오류유형 분포
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#8b5cf6' }}></div>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>복창오류</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>{INC.filter(i => i.airline === airlineCode && i.subError === '복창오류').length}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#22c55e' }}></div>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>고도이탈</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>{INC.filter(i => i.airline === airlineCode && i.subError === '고도이탈').length}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#ef4444' }}></div>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>무응답/재호출</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>{INC.filter(i => i.airline === airlineCode && i.subError === '무응답/재호출').length}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#f59e0b' }}></div>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>비행경로이탈</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>{INC.filter(i => i.airline === airlineCode && i.subError === '비행경로이탈').length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 인시던트 카드 */}
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', marginBottom: '20px' }}>
                ⚠️ 오류 발생 편명 ({total}건)
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                {incidents.map((incident: any) => (
                  <div
                    key={incident.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '8px',
                      padding: '24px',
                      borderLeft: `5px solid ${riskColor[incident.risk]}`,
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      transition: 'box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)')}
                  >
                    {/* 편명 및 타입 정보 */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '18px' }}>{incident.mine}</span>
                          <span style={{ color: '#d1d5db', fontSize: '14px' }}>↔</span>
                          <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '18px' }}>{incident.other}</span>
                        </div>
                        <button
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            background: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          조치 등록
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            backgroundColor:
                              incident.errorType === '관제사 오류'
                                ? '#fef2f2'
                                : incident.errorType === '조종사 오류'
                                ? '#fff7ed'
                                : '#f0fdf4',
                            color:
                              incident.errorType === '관제사 오류'
                                ? '#dc2626'
                                : incident.errorType === '조종사 오류'
                                ? '#d97706'
                                : '#16a34a',
                          }}
                        >
                          {incident.errorType}
                        </span>
                        {incident.subError && (
                          <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#f3e8ff', color: '#a855f7' }}>
                            {incident.subError}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 상세 정보 그리드 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ background: '#f3f4f6', padding: '14px', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>발생건수</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: incident.count >= 4 ? '#dc2626' : incident.count >= 2 ? '#f97316' : '#6b7280' }}>
                          {incident.count}건
                        </div>
                      </div>
                      <div style={{ background: '#f3f4f6', padding: '14px', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>최근 발생</div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937' }}>{incident.lastDate.slice(5)}</div>
                      </div>
                      <div style={{ background: '#f3f4f6', padding: '14px', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>유사성</div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            backgroundColor:
                              incident.similarity === '매우높음'
                                ? '#fef2f2'
                                : incident.similarity === '높음'
                                ? '#fff7ed'
                                : '#f0fdf4',
                            color:
                              incident.similarity === '매우높음'
                                ? '#dc2626'
                                : incident.similarity === '높음'
                                ? '#d97706'
                                : '#16a34a',
                          }}
                        >
                          {incident.similarity}
                        </span>
                      </div>
                      <div style={{ background: '#f3f4f6', padding: '14px', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>위험도</div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            backgroundColor:
                              incident.risk === '매우높음'
                                ? '#fef2f2'
                                : incident.risk === '높음'
                                ? '#fff7ed'
                                : '#f0fdf4',
                            color:
                              incident.risk === '매우높음'
                                ? '#dc2626'
                                : incident.risk === '높음'
                                ? '#d97706'
                                : '#16a34a',
                          }}
                        >
                          {incident.risk}
                        </span>
                      </div>
                    </div>

                    {/* 발생 이력 */}
                    {incident.dates && incident.dates.length > 0 && (
                      <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>📅 발생 이력</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {incident.dates.map((date: string, idx: number) => (
                            <span key={idx} style={{ fontSize: '11px', background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '3px' }}>
                              {date}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {incidents.length === 0 && (
                <div style={{ background: '#ffffff', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
                  <p style={{ color: '#6b7280' }}>등록된 유사호출부호 발생 이력이 없습니다</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'actions' && (
            <div style={{ background: '#ffffff', borderRadius: '8px', padding: '32px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ textAlign: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📭</div>
                <p style={{ color: '#6b7280' }}>조치 이력 관리 기능은 준비 중입니다</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
