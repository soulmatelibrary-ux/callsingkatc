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

export function OverviewTab() {
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const pageSizeOptions = [10, 30, 50, 100];
  const accessToken = useAuthStore((s) => s.accessToken);

  const airlinesQuery = useAirlines();
  const callsignsQuery = useCallsignsWithActions({
    riskLevel: selectedRiskLevel || undefined,
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
  const totalItems = pagination?.total ?? 0;
  const totalPagesFromApi = pagination?.totalPages ?? 0;
  const computedTotalPages = totalPagesFromApi > 0 ? totalPagesFromApi : 1;
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(page * limit, totalItems);

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
      {/* KPI 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <StatCard label="총 호출부호" value={stats.total} color="text-gray-900" />
        <StatCard label="매우높음" value={stats.veryHigh} color="text-red-600" />
        <StatCard label="높음" value={stats.high} color="text-amber-600" />
        <StatCard label="낮음" value={stats.low} color="text-emerald-600" />
      </div>

      {/* 호출부호 테이블 */}
      <div className="bg-white rounded-none shadow-sm border border-gray-100">
        {/* 헤더 */}
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">호출부호 목록</h3>
            <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">
              Call Signs List - 양쪽 항공사 조치상태 비교
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 rounded-none transition-all"
          >
            새로고침
          </button>
        </div>

        {/* 필터 */}
        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              <select
                value={selectedRiskLevel}
                onChange={(e) => {
                  setSelectedRiskLevel(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 border border-gray-200 bg-white rounded-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold shadow-sm transition-all"
              >
                <option value="">위험도 선택</option>
                <option value="매우높음">매우높음</option>
                <option value="높음">높음</option>
                <option value="낮음">낮음</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                페이지당
              </span>
              <select
                value={String(limit)}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-4 py-2.5 border border-gray-200 bg-white rounded-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold shadow-sm transition-all"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}개
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 테이블 */}
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white">
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    호출부호
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    위험도
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    유사도
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    오류유형
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    발생횟수
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    최근발생일
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    자사 조치
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    타사 조치
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    전체 완료
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    등록일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((callsign: any) => (
                  <tr key={callsign.id} className="group hover:bg-primary/[0.02] transition-all">
                    {/* 호출부호 */}
                    <td className="px-6 py-5 font-medium text-gray-700 whitespace-nowrap">{callsign.callsign_pair}</td>

                    {/* 위험도 */}
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border whitespace-nowrap ${
                          callsign.risk_level === '매우높음'
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : callsign.risk_level === '높음'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}
                      >
                        {callsign.risk_level}
                      </span>
                    </td>

                    {/* 유사도 */}
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                          callsign.similarity === '매우높음'
                            ? 'bg-red-50 text-red-600'
                            : callsign.similarity === '높음'
                            ? 'bg-orange-50 text-orange-600'
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {callsign.similarity || '-'}
                      </span>
                    </td>

                    {/* 오류유형 */}
                    <td className="px-6 py-5 text-gray-700 text-[12px] whitespace-nowrap">{callsign.error_type || '-'}</td>

                    {/* 발생횟수 */}
                    <td className="px-6 py-5 font-bold text-gray-900 whitespace-nowrap text-center">{callsign.occurrence_count ?? 0}</td>

                    {/* 최근 발생일 */}
                    <td className="px-6 py-5 text-gray-500 font-medium whitespace-nowrap">
                      {callsign.last_occurred_at
                        ? new Date(callsign.last_occurred_at).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })
                        : '-'}
                    </td>

                    {/* 자사 조치 상태 */}
                    <td className="px-6 py-5">
                      {(() => {
                        const meta = getActionStatusMeta(callsign.my_action_status);
                        return (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border whitespace-nowrap ${meta.bubble}`}
                          >
                            {meta.label}
                          </span>
                        );
                      })()}
                    </td>

                    {/* 타사 조치 상태 */}
                    <td className="px-6 py-5">
                      {(() => {
                        const meta = getActionStatusMeta(callsign.other_action_status);
                        return (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border whitespace-nowrap ${meta.bubble}`}
                          >
                            {meta.label}
                          </span>
                        );
                      })()}
                    </td>

                    {/* 전체 완료 여부 */}
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border whitespace-nowrap ${
                          callsign.both_completed
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-gray-50 text-gray-600 border-gray-100'
                        }`}
                      >
                        {callsign.both_completed ? '✓ 완료' : '미완료'}
                      </span>
                    </td>

                    {/* 등록일 */}
                    <td className="px-6 py-5 text-gray-400 font-medium whitespace-nowrap">
                      {callsign.uploaded_at
                        ? new Date(callsign.uploaded_at).toLocaleDateString('ko-KR', {
                          month: 'short',
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
          <div className="px-8 py-12 text-center">
            <p className="text-sm font-bold text-gray-400 uppercase">No Data</p>
          </div>
        )}

        {/* 페이지네이션 */}
        <div className="px-8 py-6 border-t border-gray-50 flex justify-between items-center bg-gray-50/30">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            페이지 {page} / {computedTotalPages} · 총 {totalItems}건
            {totalItems > 0 ? ` (${startItem}-${endItem})` : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-200 rounded-none hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
            >
              이전
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= computedTotalPages || rows.length === 0}
              className="px-3 py-1 border border-gray-200 rounded-none hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
