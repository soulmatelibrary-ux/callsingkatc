'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCallsignsWithActions } from '@/hooks/useActions';
import { useAirlines } from '@/hooks/useAirlines';
import { useAuthStore } from '@/store/authStore';
import { StatCard } from './StatCard';

interface StatsResponse {
  total: number;
  veryHigh: number;
  high: number;
  low: number;
}

// 기본 날짜값: 1개월 전 ~ 오늘
const getDefaultDateFrom = () => {
  const today = new Date();
  const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const year = oneMonthAgo.getFullYear();
  const month = String(oneMonthAgo.getMonth() + 1).padStart(2, '0');
  const day = String(oneMonthAgo.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultDateTo = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function OverviewTab() {
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('');
  const [selectedAirlineId, setSelectedAirlineId] = useState<string>('');
  const [selectedActionStatus, setSelectedActionStatus] = useState<string>('');
  const [selectedActionType, setSelectedActionType] = useState<string>('');
  const [completedDateFrom, setCompletedDateFrom] = useState<string>(getDefaultDateFrom());
  const [completedDateTo, setCompletedDateTo] = useState<string>(getDefaultDateTo());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const pageSizeOptions = [10, 30, 50, 100];
  const accessToken = useAuthStore((s) => s.accessToken);

  const airlinesQuery = useAirlines();
  const callsignsQuery = useCallsignsWithActions({
    riskLevel: selectedRiskLevel || undefined,
    airlineId: selectedAirlineId || undefined,
    myActionStatus: selectedActionStatus || undefined,
    actionType: selectedActionType || undefined,
    completedDateFrom: completedDateFrom || undefined,
    completedDateTo: completedDateTo || undefined,
    page,
    limit,
  });

  // 전체 통계 조회
  const statsQuery = useQuery({
    queryKey: ['callsigns-stats', selectedRiskLevel],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const params = new URLSearchParams();
      if (selectedRiskLevel) params.append('riskLevel', selectedRiskLevel);

      const response = await fetch(`/api/callsigns/stats?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('통계 조회 실패');
      }

      return (await response.json()) as StatsResponse;
    },
    enabled: !!accessToken,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // KPI 데이터
  const stats = statsQuery.data || {
    total: 0,
    veryHigh: 0,
    high: 0,
    low: 0,
  };

  const rows = callsignsQuery.data?.data ?? [];
  const pagination = callsignsQuery.data?.pagination;
  const summary = callsignsQuery.data?.summary;
  const totalItems = pagination?.total ?? 0;
  const totalPagesFromApi = pagination?.totalPages ?? 0;
  const computedTotalPages = totalPagesFromApi > 0 ? totalPagesFromApi : 1;
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(page * limit, totalItems);

  // 필터 적용 여부 확인
  const hasFilters = selectedRiskLevel || selectedAirlineId || selectedActionStatus;

  useEffect(() => {
    if (!pagination) return;
    if (pagination.totalPages === 0) {
      if (page !== 1) {
        setPage(1);
      }
      return;
    }
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [pagination, page]);

  const getActionStatusMeta = (status?: string) => {
    const normalized = (status || 'no_action').toLowerCase();
    switch (normalized) {
      case 'completed':
        return {
          label: '완료',
          bubble: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        };
      case 'in_progress':
        return {
          label: '조치중',
          bubble: 'bg-blue-50 text-blue-600 border-blue-100',
        };
      case 'pending':
        return {
          label: '미조치',
          bubble: 'bg-amber-50 text-amber-600 border-amber-100',
        };
      case 'no_action':
      default:
        return {
          label: '미등록',
          bubble: 'bg-gray-50 text-gray-600 border-gray-100',
        };
    }
  };

  const handleReset = () => {
    setSelectedRiskLevel('');
    setSelectedAirlineId('');
    setSelectedActionStatus('');
    setSelectedActionType('');
    setCompletedDateFrom(getDefaultDateFrom());
    setCompletedDateTo(getDefaultDateTo());
    setPage(1);
  };

  if (callsignsQuery.isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
          Loading Data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI 카드 또는 필터 결과 요약 카드 */}
      {hasFilters && summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard label="전체" value={summary.total} color="text-gray-900" />
          <StatCard label="완료" value={summary.completed} color="text-emerald-600" />
          <StatCard label="진행중" value={summary.in_progress} color="text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <StatCard label="총 호출부호" value={stats.total} color="text-gray-900" />
          <StatCard label="매우높음" value={stats.veryHigh} color="text-red-600" />
          <StatCard label="높음" value={stats.high} color="text-amber-600" />
          <StatCard label="낮음" value={stats.low} color="text-emerald-600" />
        </div>
      )}

      {/* 헤더 및 외부 액션 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">호출부호 목록</h3>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            양쪽 항공사 조치상태 비교 현황
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all shadow-sm"
          >
            초기화
          </button>
          <button
            onClick={async () => {
              const XLSX = await import('xlsx');
              const excelRows = rows.map((callsign) => ({
                '호출부호 쌍': callsign.callsign_pair,
                '위험도': callsign.risk_level,
                '유사도': callsign.similarity || '-',
                '오류유형': callsign.error_type || '-',
                '발생횟수': callsign.occurrence_count || 0,
                '최근발생일': callsign.last_occurred_at
                  ? new Date(callsign.last_occurred_at).toLocaleDateString('ko-KR')
                  : '-',
                '조치유형': callsign.action_type || '-',
                '처리일자': callsign.action_completed_at
                  ? new Date(callsign.action_completed_at).toLocaleDateString('ko-KR')
                  : '-',
                '자사(코드)': callsign.my_airline_code || '-',
                '자사 조치상태': getActionStatusMeta(callsign.my_action_status).label,
                '타사(코드)': callsign.other_airline_code || '-',
                '타사 조치상태': getActionStatusMeta(callsign.other_action_status).label,
                '전체 완료': callsign.bothCompleted ? '완료' : '미완료',
                '등록일': callsign.uploaded_at
                  ? new Date(callsign.uploaded_at).toLocaleDateString('ko-KR')
                  : '-',
              }));
              const ws = XLSX.utils.json_to_sheet(excelRows);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, '호출부호 현황');
              XLSX.writeFile(wb, `호출부호현황_${new Date().toLocaleDateString('ko-KR')}.xlsx`);
            }}
            disabled={rows.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-indigo-600/20"
          >
            📊 Excel 저장
          </button>
          <button
            onClick={() => {
              // 새로고침 로직
              callsignsQuery.refetch();
              statsQuery.refetch();
            }}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 rounded-xl transition-all shadow-md"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col lg:flex-row gap-5">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 flex-1">
          <div className="relative">
            <select
              value={selectedRiskLevel}
              onChange={(e) => {
                setSelectedRiskLevel(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-slate-700 appearance-none"
            >
              <option value="">위험도 전체</option>
              <option value="매우높음">매우높음</option>
              <option value="높음">높음</option>
              <option value="낮음">낮음</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={selectedAirlineId}
              onChange={(e) => {
                setSelectedAirlineId(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-slate-700 appearance-none"
            >
              <option value="">항공사 전체</option>
              {airlinesQuery.data?.map((airline) => (
                <option key={airline.id} value={airline.id}>
                  {airline.code} - {airline.name_ko}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={selectedActionStatus}
              onChange={(e) => {
                setSelectedActionStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-slate-700 appearance-none"
            >
              <option value="">조치상태 전체</option>
              <option value="completed">완료</option>
              <option value="in_progress">진행중</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={selectedActionType}
              onChange={(e) => {
                setSelectedActionType(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-slate-700 appearance-none"
            >
              <option value="">조치유형 전체</option>
              <option value="편명 변경">편명 변경</option>
              <option value="브리핑 시행">브리핑 시행</option>
              <option value="모니터링 강화">모니터링 강화</option>
              <option value="절차 개선">절차 개선</option>
              <option value="시스템 개선">시스템 개선</option>
              <option value="기타">기타</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <div className="relative">
            <input
              type="date"
              value={completedDateFrom}
              onChange={(e) => {
                setCompletedDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-slate-700"
            />
          </div>

          <div className="relative">
            <input
              type="date"
              value={completedDateTo}
              onChange={(e) => {
                setCompletedDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-slate-700"
            />
          </div>
        </div>

        {/* 페이지당 선택 */}
        <div className="flex items-center gap-3 lg:pl-5 lg:border-l lg:border-slate-200/80">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:block whitespace-nowrap">
            보기 설정
          </span>
          <div className="relative">
            <select
              value={String(limit)}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="pl-4 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-slate-700 appearance-none"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}개씩
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      {/* 호출부호 테이블 영역 */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 overflow-hidden">
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100/80">
                  <th className="px-6 py-5 text-left text-[12px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    호출부호
                  </th>
                  <th className="px-6 py-5 text-left text-[12px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    위험도
                  </th>
                  <th className="px-6 py-5 text-left text-[12px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    유사도
                  </th>
                  <th className="px-6 py-5 text-left text-[12px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    오류유형
                  </th>
                  <th className="px-6 py-5 text-center text-[12px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    발생
                  </th>
                  <th className="px-6 py-5 text-left text-[12px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    최근발생일
                  </th>
                  <th className="px-6 py-5 text-left text-[12px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    조치유형
                  </th>
                  <th className="px-6 py-5 text-left text-[12px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    처리일자
                  </th>
                  <th className="px-6 py-5 text-left text-[12px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    자사 조치
                  </th>
                  <th className="px-6 py-5 text-left text-[12px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    타사 조치
                  </th>
                  <th className="px-6 py-5 text-left text-[12px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    상태
                  </th>
                  <th className="px-6 py-5 text-left text-[12px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    등록일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((callsign) => (
                  <tr key={callsign.id} className="group hover:bg-slate-50/50 transition-colors">
                    {/* 호출부호 */}
                    <td className="px-6 py-5 font-bold text-slate-800 whitespace-nowrap text-[15px]">{callsign.callsign_pair}</td>

                    {/* 위험도 */}
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-black tracking-wide whitespace-nowrap ${callsign.risk_level === '매우높음'
                          ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-500/20'
                          : callsign.risk_level === '높음'
                            ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-500/20'
                            : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20'
                          }`}
                      >
                        {callsign.risk_level}
                      </span>
                    </td>

                    {/* 유사도 */}
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap ${callsign.similarity === '매우높음'
                          ? 'bg-rose-50 text-rose-600'
                          : callsign.similarity === '높음'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-slate-50 text-slate-600'
                          }`}
                      >
                        {callsign.similarity || '-'}
                      </span>
                    </td>

                    {/* 오류유형 */}
                    <td className="px-6 py-5 text-slate-600 font-medium whitespace-nowrap">{callsign.error_type || '-'}</td>

                    {/* 발생횟수 */}
                    <td className="px-6 py-5 font-bold text-slate-800 whitespace-nowrap text-center text-[15px]">{callsign.occurrence_count ?? 0}</td>

                    {/* 최근 발생일 */}
                    <td className="px-6 py-5 text-slate-500 font-medium whitespace-nowrap text-[13px]">
                      {callsign.last_occurred_at
                        ? new Date(callsign.last_occurred_at).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                        })
                        : '-'}
                    </td>

                    {/* 조치유형 */}
                    <td className="px-6 py-5 text-slate-600 font-semibold whitespace-nowrap">
                      {callsign.action_type || '-'}
                    </td>

                    {/* 처리일자 */}
                    <td className="px-6 py-5 text-slate-500 font-medium whitespace-nowrap text-[13px]">
                      {callsign.action_completed_at
                        ? new Date(callsign.action_completed_at).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                        })
                        : '-'}
                    </td>

                    {/* 자사 조치 상태 */}
                    <td className="px-6 py-5">
                      {(() => {
                        const meta = getActionStatusMeta(callsign.my_action_status);
                        return (
                          <div className="flex flex-col gap-1.5 justify-center">
                            <span className="text-[10px] font-bold text-slate-400">{callsign.my_airline_code}</span>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[10px] font-bold border whitespace-nowrap w-fit ${meta.bubble}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* 타사 조치 상태 */}
                    <td className="px-6 py-5">
                      {(() => {
                        const meta = getActionStatusMeta(callsign.other_action_status);
                        return (
                          <div className="flex flex-col gap-1.5 justify-center">
                            <span className="text-[10px] font-bold text-slate-400">{callsign.other_airline_code || '-'}</span>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[10px] font-bold border whitespace-nowrap w-fit ${meta.bubble}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* 전체 완료 여부 */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5 justify-center">
                        {callsign.bothCompleted ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-100 whitespace-nowrap w-fit">
                            ✓ 양쪽완료
                          </span>
                        ) : (
                          <>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] text-[10px] font-bold border bg-amber-50 text-amber-600 border-amber-100 whitespace-nowrap w-fit">
                              부분완료
                            </span>
                            <span className="text-[9px] font-semibold text-slate-400">
                              {callsign.my_action_status === 'completed' && callsign.other_action_status !== 'completed'
                                ? `${callsign.my_airline_code} 완료`
                                : callsign.my_action_status !== 'completed' && callsign.other_action_status === 'completed'
                                  ? `${callsign.other_airline_code} 완료`
                                  : '미조치'}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 등록일 */}
                    <td className="px-6 py-5 text-slate-400 font-medium whitespace-nowrap text-[13px]">
                      {callsign.uploaded_at
                        ? new Date(callsign.uploaded_at).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                        })
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-8 py-32 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Data</p>
          </div>
        )}

        {/* 페이지네이션 */}
        {rows.length > 0 && (
          <div className="px-8 py-6 border-t border-slate-100/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
            <span className="text-[12px] font-bold text-slate-400 tracking-wide">
              총 <span className="text-slate-700">{totalItems}</span>건 중 {startItem}-{endItem}
            </span>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-1.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:shadow-none transition-all"
              >
                이전
              </button>
              <div className="w-px h-4 bg-slate-200"></div>
              <span className="px-3 text-sm font-bold text-slate-700">
                {page} <span className="text-slate-400 mx-1">/</span> {computedTotalPages}
              </span>
              <div className="w-px h-4 bg-slate-200"></div>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= computedTotalPages || rows.length === 0}
                className="px-4 py-1.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:shadow-none transition-all"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
