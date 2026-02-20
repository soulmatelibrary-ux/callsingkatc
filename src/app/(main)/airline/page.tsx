'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { parseJsonCookie } from '@/lib/cookies';
import { ROUTES } from '@/lib/constants';
import { useAirlineActions, useAirlineCallsigns } from '@/hooks/useActions';
import { useAuthStore } from '@/store/authStore';
import { ActionModal } from '@/components/actions/ActionModal';

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

// 목업 데이터 제거 - 실제 DB 데이터 사용

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AirlinePage() {
  const router = useRouter();
  const [airlineCode, setAirlineCode] = useState<string>('');
  const [airlineName, setAirlineName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incidents');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    return formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return formatDateInput(now);
  });
  const [activeRange, setActiveRange] = useState<'custom' | 'today' | '1w' | '2w' | '1m'>('custom');
  const [errorTypeFilter, setErrorTypeFilter] = useState<'all' | '관제사 오류' | '조종사 오류' | '오류 미발생'>('all');

  // 조치이력 탭용 state
  const [actionPage, setActionPage] = useState(1);
  const [actionLimit, setActionLimit] = useState(30);
  const [actionSearch, setActionSearch] = useState('');
  const [actionSearchInput, setActionSearchInput] = useState('');
  const [actionStatusFilter, setActionStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [airlineId, setAirlineId] = useState<string | undefined>(undefined);

  const accessToken = useAuthStore((s) => s.accessToken);

  // 조치 목록 데이터
  const { data: actionsData, isLoading: actionsLoading } = useAirlineActions({
    airlineId: airlineId,
    status: actionStatusFilter === 'all' ? undefined : actionStatusFilter,
    search: actionSearch || undefined,
    page: actionPage,
    limit: actionLimit,
  });

  // 호출부호 목록 (incidents 및 조치 등록에 사용)
  const { data: callsignsData, isLoading: callsignsLoading } = useAirlineCallsigns(airlineId, {
    limit: 1000,
  });

  useEffect(() => {
    console.log('🔄 airline/page useEffect 실행됨');

    // refreshToken은 httpOnly라서 user 쿠키 존재 여부로 로그인 상태를 확인한다
    const userCookie = document.cookie
      .split(';')
      .find(c => c.trim().startsWith('user='));

    console.log('📍 userCookie 발견:', !!userCookie);

    const userData = parseJsonCookie<CookieUser>(userCookie);

    if (!userData) {
      console.log('❌ 사용자 정보 파싱 실패 - 첫 페이지로 이동');
      router.push(ROUTES.LOGIN);
      return;
    }

    let code = userData.airline?.code || '';
    let name = userData.airline?.name_ko || '';
    let id = (userData as any).airline?.id || '';

    if (!code) {
      code = 'KAL';
      name = '대한항공';
      console.log('📍 기본값 사용');
    }

    if (!name && code) {
      name = AL[code]?.n || '';
    }

    console.log('📍 최종 항공사:', code, name, id);

    setAirlineCode(code);
    setAirlineName(name);
    if (id) {
      setAirlineId(id);
    }
    console.log('✅ 로딩 완료 - setLoading(false) 호출');
    setLoading(false);
  }, [router]);

  const riskColor: Record<string, string> = {
    '매우높음': '#dc2626',
    '높음': '#f59e0b',
    '낮음': '#16a34a',
    '매우낮음': '#0891b2',
  };

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setStartDate(value);
    setActiveRange('custom');
    if (endDate && value && value > endDate) {
      setEndDate(value);
    }
  }

  function handleEndDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setEndDate(value);
    setActiveRange('custom');
    if (startDate && value && value < startDate) {
      setStartDate(value);
    }
  }

  function applyQuickRange(type: 'today' | '1w' | '2w' | '1m') {
    const now = new Date();
    let start = new Date(now);
    const end = new Date(now);

    if (type === 'today') {
      // 그대로 오늘 하루
    } else if (type === '1w') {
      start.setDate(now.getDate() - 6);
    } else if (type === '2w') {
      start.setDate(now.getDate() - 13);
    } else if (type === '1m') {
      start.setDate(now.getDate() - 29);
    }

    setStartDate(formatDateInput(start));
    setEndDate(formatDateInput(end));
    setActiveRange(type);
  }

  function handleOpenActionModal(incident: any) {
    setSelectedIncident(incident);
    setIsActionModalOpen(true);
  }

  function handleCloseActionModal() {
    setIsActionModalOpen(false);
    setSelectedIncident(null);
  }

  if (loading || callsignsLoading) {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  // DB에서 가져온 callsigns 데이터를 incidents 형태로 변환
  const incidents = callsignsData?.data.map((cs) => ({
    id: cs.id,
    pair: cs.callsign_pair,
    mine: cs.my_callsign,
    other: cs.other_callsign,
    airline: cs.airline_code,
    errorType: cs.error_type || '오류 미발생',
    subError: cs.sub_error || '',
    risk: cs.risk_level || '낮음',
    similarity: cs.similarity || '낮음',
    count: cs.occurrence_count || 0,
    lastDate: cs.last_occurred_at ? new Date(cs.last_occurred_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dates: [], // 상세 날짜 이력은 별도 테이블 필요 시 추가
  })) || [];

  const startDateObj = startDate ? new Date(startDate) : null;
  const endDateObj = endDate ? new Date(endDate) : null;

  const filteredIncidents = incidents.filter((incident) => {
    if (!startDateObj || !endDateObj) return true;
    const incidentDate = new Date(incident.lastDate);
    if (Number.isNaN(incidentDate.getTime())) return true;
    return incidentDate >= startDateObj && incidentDate <= endDateObj;
  });

  // 조치 완료된 인시던트 필터링 (상태가 completed인 조치가 있는 인시던트 제외)
  const completedActions = actionsData?.data.filter(action => action.status === 'completed') || [];
  const completedCallsigns = new Set(
    completedActions
      .map(a => a.callsign?.callsign_pair)
      .filter(Boolean)
  );

  const incidentsWithoutCompleted = filteredIncidents.filter((incident) => {
    // 유사호출부호(pair)로 매칭
    if (completedCallsigns.has(incident.pair)) {
      return false;
    }
    return true;
  });

  // 통계는 조치 완료된 것을 제외한 인시던트 기준
  const atcCount = incidentsWithoutCompleted.filter(i => i.errorType === '관제사 오류').length;
  const pilotCount = incidentsWithoutCompleted.filter(i => i.errorType === '조종사 오류').length;
  const noneCount = incidentsWithoutCompleted.filter(i => i.errorType === '오류 미발생').length;
  const total = incidentsWithoutCompleted.length;

  const visibleIncidents =
    errorTypeFilter === 'all'
      ? incidentsWithoutCompleted
      : incidentsWithoutCompleted.filter((i) => i.errorType === errorTypeFilter);

  const selectedErrorLabel =
    errorTypeFilter === 'all' ? '전체' : errorTypeFilter;

  const subTypeStats = [
    {
      key: '복창오류',
      label: '복창오류',
      count: visibleIncidents.filter((i) => i.subError === '복창오류').length,
      color: '#6366f1',
    },
    {
      key: '무응답/재호출',
      label: '무응답/재호출',
      count: visibleIncidents.filter((i) => i.subError === '무응답/재호출').length,
      color: '#4f46e5',
    },
    {
      key: '고도이탈',
      label: '고도이탈',
      count: visibleIncidents.filter((i) => i.subError === '고도이탈').length,
      color: '#10b981',
    },
    {
      key: '비행경로이탈',
      label: '비행경로이탈',
      count: visibleIncidents.filter((i) => i.subError === '비행경로이탈').length,
      color: '#f97316',
    },
    {
      key: '기타',
      label: '기타',
      count: visibleIncidents.filter(
        (i) =>
          i.subError &&
          !['복창오류', '무응답/재호출', '고도이탈', '비행경로이탈'].includes(
            i.subError,
          ),
      ).length,
      color: '#6b7280',
    },
    {
      key: '오류 미발생',
      label: '오류 미발생',
      count: visibleIncidents.filter((i) => i.errorType === '오류 미발생').length,
      color: '#22c55e',
    },
  ];

  const maxSubCount = Math.max(
    ...subTypeStats.map((s) => s.count),
    1,
  );

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        }}
      >
      {/* 상단 정보 */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '24px 32px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <span style={{ fontSize: '32px' }}>✈️</span>
            <div>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#1e3a5f',
                  margin: '0 0 6px 0',
                }}
              >
                {airlineName} - 유사호출부호 경고시스템
              </h1>
              <p
                style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  margin: '0',
                }}
              >
                항공사 전용 · 사후분석 및 조치관리
              </p>
            </div>
          </div>
          <div
            style={{
              textAlign: 'right',
              color: '#6b7280',
              fontSize: '13px',
            }}
          >
            {new Date().toLocaleDateString('ko-KR')}
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          paddingLeft: '32px',
          paddingRight: '32px',
        }}
      >
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
                borderBottom:
                  activeTab === 'actions'
                    ? '2px solid #2563eb'
                    : '2px solid transparent',
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
              {/* 조회 기간 필터 */}
              <div
                style={{
                  marginBottom: '24px',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: '120px',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>📅</span>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#374151',
                      }}
                    >
                      조회기간
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <input
                      type="date"
                      value={startDate}
                      onChange={handleStartDateChange}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '13px',
                        color: '#111827',
                      }}
                    />
                    <span style={{ color: '#9ca3af' }}>~</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={handleEndDateChange}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '13px',
                        color: '#111827',
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => applyQuickRange('today')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '999px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: '1px solid #d1d5db',
                        backgroundColor:
                          activeRange === 'today' ? '#2563eb' : '#ffffff',
                        color: activeRange === 'today' ? '#ffffff' : '#4b5563',
                        cursor: 'pointer',
                      }}
                    >
                      오늘
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickRange('1w')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '999px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: '1px solid #d1d5db',
                        backgroundColor:
                          activeRange === '1w' ? '#2563eb' : '#ffffff',
                        color: activeRange === '1w' ? '#ffffff' : '#4b5563',
                        cursor: 'pointer',
                      }}
                    >
                      최근 1주
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickRange('2w')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '999px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: '1px solid #d1d5db',
                        backgroundColor:
                          activeRange === '2w' ? '#2563eb' : '#ffffff',
                        color: activeRange === '2w' ? '#ffffff' : '#4b5563',
                        cursor: 'pointer',
                      }}
                    >
                      최근 2주
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickRange('1m')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '999px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: '1px solid #d1d5db',
                        backgroundColor:
                          activeRange === '1m' ? '#2563eb' : '#ffffff',
                        color: activeRange === '1m' ? '#ffffff' : '#4b5563',
                        cursor: 'pointer',
                      }}
                    >
                      최근 1개월
                    </button>
                  </div>
                </div>
              </div>
              {/* 오류유형 요약 + 세부오류유형 분포 레이아웃 */}
              {total > 0 && (
                <div
                  style={{
                    marginBottom: '32px',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1.35fr)',
                    gap: '24px',
                  }}
                >
                  {/* 좌측: 오류유형 요약 */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '20px 24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#111827',
                        marginBottom: '12px',
                      }}
                    >
                      오류유형 요약
                    </h3>
                    <div style={{ marginBottom: '18px' }}>
                      <div
                        style={{
                          fontSize: '32px',
                          fontWeight: 800,
                          color: '#111827',
                          lineHeight: 1,
                          marginBottom: '4px',
                        }}
                      >
                        {visibleIncidents.length}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        건 ({selectedErrorLabel === '전체' ? '전체' : selectedErrorLabel})
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: '12px',
                      }}
                    >
                      <div
                        onClick={() =>
                          setErrorTypeFilter(
                            errorTypeFilter === '관제사 오류' ? 'all' : '관제사 오류',
                          )
                        }
                        style={{
                          background: '#fff5f5',
                          borderRadius: '10px',
                          padding: '14px 12px',
                          border:
                            errorTypeFilter === '관제사 오류'
                              ? '2px solid #f97373'
                              : '1px solid #fed7d7',
                          cursor: 'pointer',
                          boxShadow:
                            errorTypeFilter === '관제사 오류'
                              ? '0 0 0 1px rgba(248,113,113,0.25)'
                              : 'none',
                          transition: 'box-shadow 0.15s, transform 0.15s',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#b91c1c',
                            fontWeight: 600,
                            marginBottom: '6px',
                          }}
                        >
                          관제사오류
                        </div>
                        <div
                          style={{
                            fontSize: '22px',
                            fontWeight: 700,
                            color: '#dc2626',
                            marginBottom: '2px',
                          }}
                        >
                          {atcCount}
                        </div>
                        <div style={{ fontSize: '11px', color: '#a16061' }}>
                          전체의{' '}
                          {total > 0 ? Math.round((atcCount / total) * 100) : 0}%
                        </div>
                      </div>

                      <div
                        onClick={() =>
                          setErrorTypeFilter(
                            errorTypeFilter === '조종사 오류' ? 'all' : '조종사 오류',
                          )
                        }
                        style={{
                          background: '#fffbf0',
                          borderRadius: '10px',
                          padding: '14px 12px',
                          border:
                            errorTypeFilter === '조종사 오류'
                              ? '2px solid #fdba74'
                              : '1px solid #fed7aa',
                          cursor: 'pointer',
                          boxShadow:
                            errorTypeFilter === '조종사 오류'
                              ? '0 0 0 1px rgba(251,191,36,0.25)'
                              : 'none',
                          transition: 'box-shadow 0.15s, transform 0.15s',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#b45309',
                            fontWeight: 600,
                            marginBottom: '6px',
                          }}
                        >
                          조종사오류
                        </div>
                        <div
                          style={{
                            fontSize: '22px',
                            fontWeight: 700,
                            color: '#f97316',
                            marginBottom: '2px',
                          }}
                        >
                          {pilotCount}
                        </div>
                        <div style={{ fontSize: '11px', color: '#a16207' }}>
                          전체의{' '}
                          {total > 0 ? Math.round((pilotCount / total) * 100) : 0}%
                        </div>
                      </div>

                      <div
                        onClick={() =>
                          setErrorTypeFilter(
                            errorTypeFilter === '오류 미발생' ? 'all' : '오류 미발생',
                          )
                        }
                        style={{
                          background: '#f0fdf4',
                          borderRadius: '10px',
                          padding: '14px 12px',
                          border:
                            errorTypeFilter === '오류 미발생'
                              ? '2px solid #4ade80'
                              : '1px solid #bbf7d0',
                          cursor: 'pointer',
                          boxShadow:
                            errorTypeFilter === '오류 미발생'
                              ? '0 0 0 1px rgba(34,197,94,0.25)'
                              : 'none',
                          transition: 'box-shadow 0.15s, transform 0.15s',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#15803d',
                            fontWeight: 600,
                            marginBottom: '6px',
                          }}
                        >
                          오류 미발생
                        </div>
                        <div
                          style={{
                            fontSize: '22px',
                            fontWeight: 700,
                            color: '#16a34a',
                            marginBottom: '2px',
                          }}
                        >
                          {noneCount}
                        </div>
                        <div style={{ fontSize: '11px', color: '#4b7c5e' }}>
                          전체의{' '}
                          {total > 0 ? Math.round((noneCount / total) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 우측: 세부오류유형 분포 */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '20px 24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#111827',
                            marginBottom: '4px',
                          }}
                        >
                          세부오류유형 분포 — {selectedErrorLabel}
                        </h3>
                        <p
                          style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: 0,
                          }}
                        >
                          선택된 오류유형 내 세부 분포입니다.
                        </p>
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#4b5563',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {visibleIncidents.length}건
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {subTypeStats.map((row) => {
                        const width = row.count === 0 ? 4 : Math.round((row.count / maxSubCount) * 100);
                        return (
                          <div
                            key={row.key}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                          >
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '12px',
                                  color: '#6b7280',
                                  marginBottom: '4px',
                                }}
                              >
                                <span>{row.label}</span>
                              </div>
                              <div
                                style={{
                                  width: '100%',
                                  height: '10px',
                                  borderRadius: '999px',
                                  background: '#f3f4f6',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${width}%`,
                                    height: '100%',
                                    borderRadius: '999px',
                                    background: row.color,
                                    opacity: row.count === 0 ? 0.15 : 0.95,
                                    transition: 'width 0.2s ease-out',
                                  }}
                                />
                              </div>
                            </div>
                            <div
                              style={{
                                width: '32px',
                                textAlign: 'right',
                                fontSize: '12px',
                                color: '#111827',
                              }}
                            >
                              {row.count}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 인시던트 카드 */}
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                ⚠️ 오류 발생 편명 ({visibleIncidents.length}건)
              </h2>
              {errorTypeFilter !== 'all' && (
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
                  선택된 오류유형: <strong>{errorTypeFilter}</strong>
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                {visibleIncidents.map((incident: any) => (
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
                          type="button"
                          onClick={() => handleOpenActionModal(incident)}
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

              {visibleIncidents.length === 0 && (
                <div style={{ background: '#ffffff', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
                  <p style={{ color: '#6b7280' }}>등록된 유사호출부호 발생 이력이 없습니다</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'actions' && (
            <>
              {/* 검색 및 필터 */}
              <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '250px' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="유사호출부호, 조치유형, 담당자 검색..."
                      value={actionSearchInput}
                      onChange={(e) => setActionSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setActionSearch(actionSearchInput);
                          setActionPage(1);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 36px 9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      onClick={() => {
                        setActionSearch(actionSearchInput);
                        setActionPage(1);
                      }}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      🔍
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>표시 개수:</span>
                  <select
                    value={actionLimit}
                    onChange={(e) => {
                      setActionLimit(parseInt(e.target.value, 10));
                      setActionPage(1);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    <option value="10">10개</option>
                    <option value="30">30개</option>
                    <option value="50">50개</option>
                    <option value="100">100개</option>
                  </select>
                </div>
              </div>

              {/* 필터 및 액션 바 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setActionStatusFilter('all');
                    setActionPage(1);
                  }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: actionStatusFilter === 'all' ? '#2563eb' : '#ffffff',
                    color: actionStatusFilter === 'all' ? '#ffffff' : '#5a6170',
                    border: actionStatusFilter === 'all' ? 'none' : '1.5px solid #e2e5ea',
                    cursor: 'pointer',
                  }}
                >
                  전체
                </button>
                <button
                  onClick={() => {
                    setActionStatusFilter('pending');
                    setActionPage(1);
                  }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: actionStatusFilter === 'pending' ? '#2563eb' : '#ffffff',
                    color: actionStatusFilter === 'pending' ? '#ffffff' : '#5a6170',
                    border: actionStatusFilter === 'pending' ? 'none' : '1.5px solid #e2e5ea',
                    cursor: 'pointer',
                  }}
                >
                  대기중
                </button>
                <button
                  onClick={() => {
                    setActionStatusFilter('in_progress');
                    setActionPage(1);
                  }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: actionStatusFilter === 'in_progress' ? '#2563eb' : '#ffffff',
                    color: actionStatusFilter === 'in_progress' ? '#ffffff' : '#5a6170',
                    border: actionStatusFilter === 'in_progress' ? 'none' : '1.5px solid #e2e5ea',
                    cursor: 'pointer',
                  }}
                >
                  ⏳ 진행중
                </button>
                <button
                  onClick={() => {
                    setActionStatusFilter('completed');
                    setActionPage(1);
                  }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: actionStatusFilter === 'completed' ? '#2563eb' : '#ffffff',
                    color: actionStatusFilter === 'completed' ? '#ffffff' : '#5a6170',
                    border: actionStatusFilter === 'completed' ? 'none' : '1.5px solid #e2e5ea',
                    cursor: 'pointer',
                  }}
                >
                  ✅ 완료
                </button>
                <div style={{ flex: '1' }}></div>
                {actionsData && (
                  <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                    총 {actionsData.pagination.total}건
                  </div>
                )}
              </div>

              {/* 조치 이력 테이블 */}
              {actionsLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>로딩 중...</div>
              ) : actionsData && actionsData.data.length > 0 ? (
                <div style={{ background: '#ffffff', border: '1px solid #e2e5ea', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fb', borderBottom: '2px solid #e2e5ea' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', color: '#5a6170', fontSize: '12px', whiteSpace: 'nowrap' }}>등록일</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', color: '#5a6170', fontSize: '12px', whiteSpace: 'nowrap' }}>예정일</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', color: '#5a6170', fontSize: '12px', whiteSpace: 'nowrap' }}>유사호출부호</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', color: '#5a6170', fontSize: '12px', whiteSpace: 'nowrap' }}>조치유형</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', color: '#5a6170', fontSize: '12px', whiteSpace: 'nowrap' }}>담당자</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', color: '#5a6170', fontSize: '12px', whiteSpace: 'nowrap' }}>상태</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', color: '#5a6170', fontSize: '12px', whiteSpace: 'nowrap' }}>완료일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actionsData.data.map((action, idx) => {
                        const statusLabel = action.status === 'pending' ? '대기중' : action.status === 'in_progress' ? '진행중' : '완료';
                        const statusBg = action.status === 'pending' ? '#fef3c7' : action.status === 'in_progress' ? '#ecfeff' : '#f0fdf4';
                        const statusColor = action.status === 'pending' ? '#ca8a04' : action.status === 'in_progress' ? '#0891b2' : '#16a34a';
                        const registeredDate = action.registered_at ? new Date(action.registered_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '') : '-';
                        const plannedDate = action.planned_due_date || '-';
                        const completedDate = action.completed_at ? new Date(action.completed_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '') : '-';
                        return (
                          <tr key={action.id} style={{ borderBottom: idx < actionsData.data.length - 1 ? '1px solid #eef0f3' : 'none', background: idx % 2 === 1 ? '#f8f9fb' : '#ffffff' }}>
                            <td style={{ padding: '10px 14px' }}>{registeredDate}</td>
                            <td style={{ padding: '10px 14px' }}>{plannedDate}</td>
                            <td style={{ padding: '10px 14px', fontWeight: '600' }}>{action.callsign?.callsign_pair || '-'}</td>
                            <td style={{ padding: '10px 14px' }}>{action.action_type}</td>
                            <td style={{ padding: '10px 14px' }}>{action.manager_name}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', background: statusBg, color: statusColor }}>{statusLabel}</span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>{completedDate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* 페이지네이션 */}
                  {actionsData.pagination.totalPages > 1 && (
                    <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderTop: '1px solid #e2e5ea' }}>
                      <button
                        onClick={() => setActionPage(1)}
                        disabled={actionPage === 1}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          background: actionPage === 1 ? '#f9fafb' : '#ffffff',
                          color: actionPage === 1 ? '#9ca3af' : '#374151',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: actionPage === 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        ««
                      </button>
                      <button
                        onClick={() => setActionPage(actionPage - 1)}
                        disabled={actionPage === 1}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          background: actionPage === 1 ? '#f9fafb' : '#ffffff',
                          color: actionPage === 1 ? '#9ca3af' : '#374151',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: actionPage === 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        «
                      </button>
                      {Array.from({ length: Math.min(5, actionsData.pagination.totalPages) }, (_, i) => {
                        const startPage = Math.max(1, Math.min(actionPage - 2, actionsData.pagination.totalPages - 4));
                        const pageNum = startPage + i;
                        if (pageNum > actionsData.pagination.totalPages) return null;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setActionPage(pageNum)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              background: pageNum === actionPage ? '#2563eb' : '#ffffff',
                              color: pageNum === actionPage ? '#ffffff' : '#374151',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setActionPage(actionPage + 1)}
                        disabled={actionPage === actionsData.pagination.totalPages}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          background: actionPage === actionsData.pagination.totalPages ? '#f9fafb' : '#ffffff',
                          color: actionPage === actionsData.pagination.totalPages ? '#9ca3af' : '#374151',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: actionPage === actionsData.pagination.totalPages ? 'not-allowed' : 'pointer',
                        }}
                      >
                        »
                      </button>
                      <button
                        onClick={() => setActionPage(actionsData.pagination.totalPages)}
                        disabled={actionPage === actionsData.pagination.totalPages}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          background: actionPage === actionsData.pagination.totalPages ? '#f9fafb' : '#ffffff',
                          color: actionPage === actionsData.pagination.totalPages ? '#9ca3af' : '#374151',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: actionPage === actionsData.pagination.totalPages ? 'not-allowed' : 'pointer',
                        }}
                      >
                        »»
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', background: '#ffffff', border: '1px solid #e2e5ea', borderRadius: '10px' }}>
                  조치 이력이 없습니다.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isActionModalOpen && selectedIncident && callsignsData && (
        <ActionModal
          airlineId={airlineId || ''}
          callsigns={callsignsData.data}
          selectedCallsign={callsignsData.data.find(
            (cs) => cs.callsign_pair === selectedIncident.pair
          )}
          onClose={handleCloseActionModal}
          onSuccess={() => {
            // 조치 등록 성공 시 페이지 새로고침
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
