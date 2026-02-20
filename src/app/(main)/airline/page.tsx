'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { parseJsonCookie } from '@/lib/cookies';
import { ROUTES } from '@/lib/constants';
import { useAirlineActions, useAirlineCallsigns } from '@/hooks/useActions';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
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
      <main className="max-w-7xl w-full mx-auto px-6 py-10 space-y-8 animate-fade-in">
        {/* 페이지 헤더 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-1 bg-primary rounded-full" />
              <span className="text-primary font-bold text-sm tracking-widest uppercase">Airline Portal</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              {airlineName} - 유사호출부호 경고시스템
            </h1>
            <p className="mt-2 text-gray-500 font-medium">항공사 전용 · 사후분석 및 조치관리</p>
          </div>
          <div className="text-sm font-bold text-gray-400 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
            {new Date().toLocaleDateString('ko-KR')}
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm border border-gray-100 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex-1 min-w-[160px] px-6 py-3 rounded-xl text-sm font-black tracking-tight transition-all ${activeTab === 'incidents'
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
              : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            📊 유사호출부호 발생현황
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 min-w-[160px] px-6 py-3 rounded-xl text-sm font-black tracking-tight transition-all ${activeTab === 'actions'
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
              : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            📋 조치 이력
          </button>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="animate-fade-in-up">
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

              {/* 상세 분석 그리드 (2:1 비율) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-12">
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">유사호출부호 발생현황</h3>
                      <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                        Risk analyzed callsign pairs ({visibleIncidents.length} cases)
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto flex-1">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white">
                          <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Callsign Pair</th>
                          <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Error Type</th>
                          <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Risk</th>
                          <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Sim. %</th>
                          <th className="px-8 py-4 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {visibleIncidents.map((incident: any) => (
                          <tr key={incident.id} className="group hover:bg-primary/[0.02] transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-gray-900 tracking-tight">{incident.pair}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">
                                  {new Date(incident.occurred_at).toLocaleString('ko-KR')}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`text-[12px] font-bold ${incident.error_type === '관제사 오류' ? 'text-rose-600' :
                                  incident.error_type === '조종사 오류' ? 'text-amber-600' : 'text-emerald-600'
                                }`}>
                                {incident.error_type}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${incident.risk === '매우높음' ? 'bg-rose-500 text-white' :
                                  incident.risk === '높음' ? 'bg-amber-400 text-white' : 'bg-emerald-400 text-white'
                                }`}>
                                {incident.risk}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-gray-700">{incident.similarity}%</span>
                                <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden hidden md:block">
                                  <div
                                    className={`h-full ${incident.similarity > 90 ? 'bg-rose-500' :
                                        incident.similarity > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                                      }`}
                                    style={{ width: `${incident.similarity}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button
                                onClick={() => handleOpenActionModal(incident)}
                                className="px-4 py-2 bg-primary text-white text-[11px] font-black rounded-xl shadow-md shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all uppercase tracking-widest"
                              >
                                조치 등록
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 우측 사이드바: 세부오류유형 분포 */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center gap-2 mb-8">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">세부 오류 분석</h3>
                  </div>

                  <div className="space-y-6">
                    {subTypeStats.map((row, i) => {
                      const width = row.count === 0 ? 0 : Math.round((row.count / maxSubCount) * 100);
                      return (
                        <div key={row.key} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-sm font-black text-gray-700 tracking-tight">{row.label}</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-black text-gray-900 leading-none">{row.count}</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Cases</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-1000 ease-out shadow-sm"
                              style={{
                                width: `${width}%`,
                                backgroundColor: row.color,
                                transitionDelay: `${i * 100}ms`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-12 p-6 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Analysis Insight</p>
                    <p className="text-[13px] font-bold text-gray-600 leading-relaxed">
                      {selectedErrorLabel} 유형 내에서 가장 높은 비율을 차지하는 항목은 <span className="text-primary">{subTypeStats[0]?.label || '-'}</span>입니다.
                    </p>
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
            // 조치 등록 성공 시 페이지 새로고침
            window.location.reload();
          }}
        />
      )
      }
    </>
  );
}
