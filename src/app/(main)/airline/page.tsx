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
  const [activeTab, setActiveTab] = useState<'incidents' | 'actions'>('incidents');
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
  const [selectedAction, setSelectedAction] = useState<any | null>(null);
  const [isActionDetailModalOpen, setIsActionDetailModalOpen] = useState(false);

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
      <main className="flex min-h-screen bg-gray-50">
        {/* 왼쪽 사이드바 */}
        <aside className="w-72 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
          {/* 사이드바 헤더 */}
          <div className="px-6 py-8 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-1 bg-primary rounded-full" />
              <span className="text-primary font-bold text-[10px] tracking-widest uppercase">Portal</span>
            </div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">{airlineName}</h2>
            <p className="text-[10px] text-gray-400 font-bold mt-1">항공사 전용</p>
            <p className="text-[10px] text-gray-400 font-medium mt-2">{new Date().toLocaleDateString('ko-KR')}</p>
          </div>

          {/* 사이드바 네비게이션 */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <button
              onClick={() => setActiveTab('incidents')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black tracking-tight transition-all text-left ${activeTab === 'incidents'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-gray-500 hover:bg-gray-100'
                }`}
            >
              <span className="text-lg">📊</span>
              <span>발생현황</span>
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black tracking-tight transition-all text-left ${activeTab === 'actions'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-gray-500 hover:bg-gray-100'
                }`}
            >
              <span className="text-lg">📋</span>
              <span>조치이력</span>
            </button>
          </nav>
        </aside>

        {/* 오른쪽 콘텐츠 영역 */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl w-full mx-auto px-8 py-10 space-y-8 animate-fade-in">
            {activeTab === 'incidents' && (
              <>
                {/* 조회 기간 필터 */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">조회 기간</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={startDate}
                          onChange={handleStartDateChange}
                          className="bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-gray-300">~</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={handleEndDateChange}
                          className="bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex bg-gray-50/50 p-1 rounded-xl border border-gray-100">
                    <button
                      type="button"
                      onClick={() => applyQuickRange('today')}
                      className={`px-4 py-2 rounded-lg text-xs font-black tracking-tight transition-all ${activeRange === 'today' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      오늘
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickRange('1w')}
                      className={`px-4 py-2 rounded-lg text-xs font-black tracking-tight transition-all ${activeRange === '1w' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      1주
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickRange('2w')}
                      className={`px-4 py-2 rounded-lg text-xs font-black tracking-tight transition-all ${activeRange === '2w' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      2주
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickRange('1m')}
                      className={`px-4 py-2 rounded-lg text-xs font-black tracking-tight transition-all ${activeRange === '1m' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      1개월
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-all text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Excel 내보내기</span>
                  </button>
                </div>
              </div>
              {/* 요약 통계 (Full Width) */}
              {total > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-[0.07] transition-opacity bg-gray-900" />
                    <div className="relative flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Total Cases</p>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p className="text-5xl font-black text-gray-900 tracking-tighter">{total}</p>
                        <span className="text-sm font-bold text-gray-400">건</span>
                      </div>
                      <p className="mt-auto pt-4 text-[12px] font-bold text-gray-400 leading-tight">분석 기간 내 전체 발생 건수</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setErrorTypeFilter(errorTypeFilter === '관제사 오류' ? 'all' : '관제사 오류')}
                    className={`group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer ${errorTypeFilter === '관제사 오류' ? 'ring-2 ring-rose-500 shadow-rose-500/10' : ''}`}
                  >
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-[0.07] transition-opacity bg-rose-600" />
                    <div className="relative flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">ATC Related</p>
                        {total > 0 && (
                          <span className="text-[10px] font-black px-2 py-1 rounded-md bg-rose-50 text-rose-600">
                            {Math.round((atcCount / total) * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p className="text-5xl font-black text-rose-600 tracking-tighter">{atcCount}</p>
                        <span className="text-sm font-bold text-gray-400">건</span>
                      </div>
                      <p className="mt-auto pt-4 text-[12px] font-bold text-gray-400 leading-tight">관제사 요인으로 판명된 사례</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setErrorTypeFilter(errorTypeFilter === '조종사 오류' ? 'all' : '조종사 오류')}
                    className={`group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer ${errorTypeFilter === '조종사 오류' ? 'ring-2 ring-amber-500 shadow-amber-500/10' : ''}`}
                  >
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-[0.07] transition-opacity bg-amber-600" />
                    <div className="relative flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Pilot Related</p>
                        {total > 0 && (
                          <span className="text-[10px] font-black px-2 py-1 rounded-md bg-amber-50 text-amber-600">
                            {Math.round((pilotCount / total) * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p className="text-5xl font-black text-amber-600 tracking-tighter">{pilotCount}</p>
                        <span className="text-sm font-bold text-gray-400">건</span>
                      </div>
                      <p className="mt-auto pt-4 text-[12px] font-bold text-gray-400 leading-tight">조종사 요인으로 판명된 사례</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setErrorTypeFilter(errorTypeFilter === '오류 미발생' ? 'all' : '오류 미발생')}
                    className={`group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer ${errorTypeFilter === '오류 미발생' ? 'ring-2 ring-emerald-500 shadow-emerald-500/10' : ''}`}
                  >
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-[0.07] transition-opacity bg-emerald-600" />
                    <div className="relative flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">No Error</p>
                        {total > 0 && (
                          <span className="text-[10px] font-black px-2 py-1 rounded-md bg-emerald-50 text-emerald-600">
                            {Math.round((noneCount / total) * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p className="text-5xl font-black text-emerald-600 tracking-tighter">{noneCount}</p>
                        <span className="text-sm font-bold text-gray-400">건</span>
                      </div>
                      <p className="mt-auto pt-4 text-[12px] font-bold text-gray-400 leading-tight">오류 없이 경고만 발생한 사례</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 발생현황 테이블 - 2단계 구조 */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">유사호출부호 발생현황</h3>
                      <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                        Risk analyzed callsign pairs ({visibleIncidents.length} cases)
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto flex-1">
                    <div className="divide-y divide-gray-50">
                      {visibleIncidents.map((incident: any) => {
                        // 호출부호 숫자 색상 처리: 같은 숫자끼리 같은 색
                        const renderColoredCallsign = (callsignPair: string) => {
                          const parts = callsignPair.split('↔');
                          if (parts.length !== 2) return callsignPair;

                          const [my, other] = [parts[0].trim(), parts[1].trim()];

                          // 모든 숫자 추출 및 색상 할당 (숫자별로 일관된 색상)
                          const colorMap: Record<string, string> = {};
                          const colors = [
                            'text-blue-600', 'text-rose-600', 'text-amber-600', 'text-emerald-600',
                            'text-cyan-600', 'text-purple-600', 'text-indigo-600', 'text-pink-600',
                            'text-lime-600', 'text-teal-600'
                          ];

                          // 숫자별 색상 맵핑 (0-9)
                          Array.from(new Set((my + other).split(''))).forEach((char, idx) => {
                            if (char >= '0' && char <= '9') {
                              const digitIdx = parseInt(char, 10);
                              colorMap[char] = colors[digitIdx % colors.length];
                            }
                          });

                          return (
                            <div className="flex items-center gap-1">
                              {Array.from(my).map((char, idx) => (
                                <span
                                  key={`my-${idx}`}
                                  className={`font-black text-sm ${
                                    char >= '0' && char <= '9' ? colorMap[char] : 'text-gray-900'
                                  }`}
                                >
                                  {char}
                                </span>
                              ))}
                              <span className="text-gray-300 font-bold">↔</span>
                              {Array.from(other).map((char, idx) => (
                                <span
                                  key={`other-${idx}`}
                                  className={`font-black text-sm ${
                                    char >= '0' && char <= '9' ? colorMap[char] : 'text-gray-900'
                                  }`}
                                >
                                  {char}
                                </span>
                              ))}
                            </div>
                          );
                        };

                        return (
                          <div key={incident.id} className="border-b-2 border-gray-100 last:border-b-0">
                            {/* 첫 번째 행: 호출부호, 오류 유형, 조치 등록 버튼 */}
                            <div className="px-8 py-5 flex items-center justify-between gap-6 group hover:bg-primary/[0.02] transition-colors border-b border-gray-50">
                              <div className="flex-1 min-w-0">
                                {renderColoredCallsign(incident.pair)}
                              </div>

                              <div className="flex-shrink-0">
                                <span className={`inline-block text-[12px] font-bold px-3 py-1 rounded-lg ${
                                  incident.error_type === '관제사 오류' ? 'text-rose-600 bg-rose-50' :
                                  incident.error_type === '조종사 오류' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                                }`}>
                                  {incident.error_type}
                                </span>
                              </div>

                              <button
                                onClick={() => handleOpenActionModal(incident)}
                                className="flex-shrink-0 px-4 py-2 bg-primary text-white text-[11px] font-black rounded-xl shadow-md shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all uppercase tracking-widest"
                              >
                                조치 등록
                              </button>
                            </div>

                            {/* 두 번째 행: 상세 정보 - 4개 컬럼 그리드 */}
                            <div className="px-8 py-5 bg-gray-50/40 grid grid-cols-4 gap-6">
                              {/* 발생건수 */}
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">발생건수</span>
                                <span className="text-lg font-black text-gray-900 mt-1">{incident.occurrence_count || '0'}건</span>
                              </div>

                              {/* 최근 발생일 */}
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">최근 발생일</span>
                                <span className="text-lg font-black text-gray-900 mt-1">
                                  {incident.occurred_at
                                    ? new Date(incident.occurred_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
                                    : '-'
                                  }
                                </span>
                              </div>

                              {/* 유사성 */}
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">유사성</span>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className={`text-lg font-black ${
                                    incident.similarity > 90 ? 'text-rose-600' :
                                    incident.similarity > 70 ? 'text-amber-600' : 'text-emerald-600'
                                  }`}>
                                    {incident.similarity > 90 ? '높음' : incident.similarity > 70 ? '중간' : '낮음'}
                                  </span>
                                  <span className="text-xs font-bold text-gray-400">({incident.similarity}%)</span>
                                </div>
                              </div>

                              {/* 오류가능성 */}
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">오류가능성</span>
                                <span className={`text-lg font-black mt-1 ${
                                  incident.risk === '매우높음' ? 'text-rose-600' :
                                  incident.risk === '높음' ? 'text-amber-600' : 'text-emerald-600'
                                }`}>
                                  {incident.risk}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {visibleIncidents.length === 0 && (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 mt-8">
                    <div className="text-4xl mb-4">✅</div>
                    <p className="text-gray-500 font-bold">등록된 유사호출부호 발생 이력이 없습니다</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'actions' && (
              <>
                {/* 검색 및 필터 상단 바 */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="조치이력 내 유사호출부호, 담당자 등을 검색하세요..."
                      value={actionSearchInput}
                      onChange={(e) => setActionSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setActionSearch(actionSearchInput);
                          setActionPage(1);
                        }
                      }}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
                    />
                    <button
                      onClick={() => {
                        setActionSearch(actionSearchInput);
                        setActionPage(1);
                      }}
                      className="absolute right-2 top-2 bottom-2 px-6 bg-primary text-white text-[11px] font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest"
                    >
                      Search
                    </button>
                  </div>

                  <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm border border-gray-100 flex items-center gap-2">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-3">Limit</span>
                    <select
                      value={actionLimit}
                      onChange={(e) => {
                        setActionLimit(parseInt(e.target.value, 10));
                        setActionPage(1);
                      }}
                      className="bg-transparent text-sm font-black text-gray-700 focus:outline-none cursor-pointer pr-4"
                    >
                      <option value="10">10 Rows</option>
                      <option value="30">30 Rows</option>
                      <option value="50">50 Rows</option>
                      <option value="100">100 Rows</option>
                    </select>
                  </div>
                </div>

                {/* 상태 필터 탭 */}
                <div className="flex flex-wrap items-center gap-2 mb-8 bg-white/50 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm border border-gray-100">
                  <button
                    onClick={() => { setActionStatusFilter('all'); setActionPage(1); }}
                    className={`flex-1 min-w-[100px] px-6 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all ${actionStatusFilter === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => { setActionStatusFilter('pending'); setActionPage(1); }}
                    className={`flex-1 min-w-[100px] px-6 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all ${actionStatusFilter === 'pending' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    대기중
                  </button>
                  <button
                    onClick={() => { setActionStatusFilter('in_progress'); setActionPage(1); }}
                    className={`flex-1 min-w-[100px] px-6 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all ${actionStatusFilter === 'in_progress' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    진행중
                  </button>
                  <button
                    onClick={() => { setActionStatusFilter('completed'); setActionPage(1); }}
                    className={`flex-1 min-w-[100px] px-6 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all ${actionStatusFilter === 'completed' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    완료
                  </button>
                  {actionsData && (
                    <div className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-l border-gray-200 ml-2">
                      Total {actionsData.pagination.total} Cases
                    </div>
                  )}
                </div>

                {/* 조치 이력 테이블 */}
                {actionsLoading ? (
                  <div className="p-20 text-center text-gray-400 font-bold animate-pulse">데이터 분석 중...</div>
                ) : actionsData && actionsData.data.length > 0 ? (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50/30">
                            <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Registered</th>
                            <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Due Date</th>
                            <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Callsign Pair</th>
                            <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                            <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Manager</th>
                            <th className="px-8 py-4 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-4 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {actionsData.data.map((action) => {
                            const statusLabel = action.status === 'pending' ? '대기중' : action.status === 'in_progress' ? '진행중' : '완료';
                            const statusStyles =
                              action.status === 'pending' ? 'text-amber-600 bg-amber-50' :
                                action.status === 'in_progress' ? 'text-blue-600 bg-blue-50' : 'text-emerald-600 bg-emerald-50';
                            const registeredDate = action.registered_at ? new Date(action.registered_at).toLocaleDateString('ko-KR') : '-';
                            const dueDate = action.planned_due_date ? (() => {
                              const d = new Date(action.planned_due_date);
                              const year = d.getFullYear();
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const day = String(d.getDate()).padStart(2, '0');
                              const hour = String(d.getHours()).padStart(2, '0');
                              const minute = String(d.getMinutes()).padStart(2, '0');
                              return `${year}-${month}-${day} ${hour}:${minute}`;
                            })() : '-';

                            return (
                              <tr key={action.id} className="group hover:bg-primary/[0.02] transition-colors">
                                <td className="px-8 py-5 text-sm font-bold text-gray-500">{registeredDate}</td>
                                <td className="px-8 py-5 text-sm font-bold text-gray-500">{dueDate}</td>
                                <td className="px-8 py-5 text-sm font-black text-gray-900 tracking-tight">{action.callsign?.callsign_pair || '-'}</td>
                                <td className="px-8 py-5 text-sm font-bold text-gray-700">{action.action_type}</td>
                                <td className="px-8 py-5 text-sm font-bold text-gray-700">{action.manager_name}</td>
                                <td className="px-8 py-5 text-center">
                                  <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black tracking-widest ${statusStyles}`}>
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="px-8 py-5 text-center">
                                  <button
                                    onClick={() => {
                                      setSelectedAction(action);
                                      setIsActionDetailModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-primary text-white text-[9px] font-black rounded-lg shadow-md shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all uppercase tracking-wider"
                                  >
                                    상세보기
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* 페이지네이션 */}
                    {actionsData.pagination.totalPages > 1 && (
                      <div className="px-8 py-6 border-t border-gray-50 flex justify-center items-center gap-2">
                        <button
                          onClick={() => setActionPage(Math.max(1, actionPage - 1))}
                          disabled={actionPage === 1}
                          className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all font-black text-xs"
                        >
                          PREV
                        </button>

                        <div className="flex gap-1 mx-4">
                          {Array.from({ length: Math.min(5, actionsData.pagination.totalPages) }, (_, i) => {
                            const startPage = Math.max(1, Math.min(actionPage - 2, actionsData.pagination.totalPages - 4));
                            const pageNum = startPage + i;
                            if (pageNum > actionsData.pagination.totalPages) return null;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setActionPage(pageNum)}
                                className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${pageNum === actionPage
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                                  }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setActionPage(Math.min(actionsData.pagination.totalPages, actionPage + 1))}
                          disabled={actionPage === actionsData.pagination.totalPages}
                          className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all font-black text-xs"
                        >
                          NEXT
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-20 text-center shadow-sm border border-gray-100">
                    <div className="text-4xl mb-4">📑</div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No action history found</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {isActionModalOpen && selectedIncident && callsignsData && (
        <ActionModal
          airlineId={airlineId || ''}
          callsigns={callsignsData.data}
          selectedCallsign={callsignsData.data.find(
            (cs) => cs.callsign_pair === selectedIncident.pair
          )}
          onClose={handleCloseActionModal}
          onSuccess={() => {
            // 조치 등록 성공 시 모달 닫기 + 조치이력 탭으로 전환
            handleCloseActionModal();
            setActiveTab('actions');
            setActionStatusFilter('all');
            setActionPage(1);
          }}
        />
      )
      }

      {isActionDetailModalOpen && selectedAction && callsignsData && (
        <ActionModal
          airlineId={airlineId || ''}
          callsigns={callsignsData.data}
          selectedCallsign={callsignsData.data.find(
            (cs) => cs.id === selectedAction.callsign_id
          )}
          actionId={selectedAction.id}
          initialData={{
            actionType: selectedAction.action_type,
            managerName: selectedAction.manager_name,
            description: selectedAction.description,
            plannedDueDate: selectedAction.planned_due_date,
            status: selectedAction.status || 'in_progress',
          }}
          onClose={() => setIsActionDetailModalOpen(false)}
          onSuccess={() => {
            setIsActionDetailModalOpen(false);
            setActionStatusFilter('all');
            setActionPage(1);
          }}
        />
      )}
    </>
  );
}
