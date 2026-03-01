'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCallsigns, useAllActions } from '@/hooks/useActions';
import { useAirlines } from '@/hooks/useAirlines';
import { useAuthStore } from '@/store/authStore';
import { StatCard } from './StatCard';
import { ActionTypeDistributionChart } from '@/components/admin/ActionTypeDistributionChart';
import { DuplicateCallsignsChart } from '@/components/admin/DuplicateCallsignsChart';

interface CallsignStatsResponse {
  total: number;
  veryHigh: number;
  high: number;
  low: number;
}

export function StatisticsTab() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const callsignsQuery = useCallsigns({ limit: 50 });
  const actionsQuery = useAllActions({ limit: 50 });
  const airlinesQuery = useAirlines();

  // 전체 호출부호 통계 (위험도별)
  const callsignStatsQuery = useQuery<CallsignStatsResponse>({
    queryKey: ['callsigns-stats', 'all'],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch('/api/callsigns/stats', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('통계 조회 실패');
      }

      return (await response.json()) as CallsignStatsResponse;
    },
    enabled: !!accessToken,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // 전체 조치 건수 및 상태별 집계 (pagination.total 활용)
  const totalActionsQuery = useAllActions({ page: 1, limit: 1 });
  const pendingActionsQuery = useAllActions({ page: 1, limit: 1, status: 'pending' });
  const inProgressActionsQuery = useAllActions({ page: 1, limit: 1, status: 'in_progress' });
  const completedActionsQuery = useAllActions({ page: 1, limit: 1, status: 'completed' });

  // KPI 데이터 계산
  const totalCallsigns = callsignsQuery.data?.pagination.total ?? 0;
  const riskStats = callsignStatsQuery.data || { total: 0, veryHigh: 0, high: 0, low: 0 };
  const actionCounts = {
    total: totalActionsQuery.data?.pagination.total ?? 0,
    pending: pendingActionsQuery.data?.pagination.total ?? 0,
    inProgress: inProgressActionsQuery.data?.pagination.total ?? 0,
    completed: completedActionsQuery.data?.pagination.total ?? 0,
  };

  // 항공사별 상세 통계
  const airlineDetailStats = useMemo(() => {
    const actionsList = actionsQuery.data?.data || [];
    return airlinesQuery.data?.map((airline) => {
      const actions = actionsList.filter((a) => a.airline_id === airline.id) || [];
      const completed = actions.filter((a) => a.status === 'completed').length;
      const total = actions.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      const pending = actions.filter((a) => a.status === 'pending').length;
      const inProgress = actions.filter((a) => a.status === 'in_progress').length;

      return {
        airline,
        total,
        completed,
        pending,
        inProgress,
        completionRate,
      };
    }) || [];
  }, [airlinesQuery.data, actionsQuery.data]);

  const isLoading =
    callsignsQuery.isLoading ||
    actionsQuery.isLoading ||
    callsignStatsQuery.isLoading ||
    totalActionsQuery.isLoading ||
    pendingActionsQuery.isLoading ||
    inProgressActionsQuery.isLoading ||
    completedActionsQuery.isLoading;

  if (isLoading) {
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
        <StatCard label="총 호출부호" value={totalCallsigns} color="text-gray-900" />
        <StatCard label="미조치" value={actionCounts.pending} color="text-amber-600" />
        <StatCard label="진행중" value={actionCounts.inProgress} color="text-blue-600" />
        <StatCard label="완료" value={actionCounts.completed} color="text-emerald-600" />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 위험도별 현황 */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 p-8">
          <h3 className="text-xl font-black text-slate-800 mb-8 tracking-tight">위험도별 현황</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">매우높음</span>
                <span className="text-sm font-black text-rose-600">{riskStats.veryHigh}건</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{
                    width: `${totalCallsigns > 0 ? (riskStats.veryHigh / totalCallsigns) * 100 : 0}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full rounded-full" style={{ maskImage: 'linear-gradient(to right, transparent, black)' }}></div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">높음</span>
                <span className="text-sm font-black text-amber-500">{riskStats.high}건</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{
                    width: `${totalCallsigns > 0 ? (riskStats.high / totalCallsigns) * 100 : 0}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full rounded-full" style={{ maskImage: 'linear-gradient(to right, transparent, black)' }}></div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">낮음</span>
                <span className="text-sm font-black text-emerald-500">{riskStats.low}건</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{
                    width: `${totalCallsigns > 0 ? (riskStats.low / totalCallsigns) * 100 : 0}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full rounded-full" style={{ maskImage: 'linear-gradient(to right, transparent, black)' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 조치 상태별 현황 */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 p-8">
          <h3 className="text-xl font-black text-slate-800 mb-8 tracking-tight">조치 상태 분포</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div> 미조치 (Pending)
                </span>
                <span className="text-sm font-black text-amber-600">{actionCounts.pending}건</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{
                    width: `${actionCounts.total > 0
                      ? (actionCounts.pending / actionCounts.total) * 100
                      : 0
                      }%`,
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full rounded-full" style={{ maskImage: 'linear-gradient(to right, transparent, black)' }}></div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div> 진행중 (In Progress)
                </span>
                <span className="text-sm font-black text-indigo-600">{actionCounts.inProgress}건</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{
                    width: `${actionCounts.total > 0
                      ? (actionCounts.inProgress / actionCounts.total) * 100
                      : 0
                      }%`,
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full rounded-full" style={{ maskImage: 'linear-gradient(to right, transparent, black)' }}></div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div> 완료 (Completed)
                </span>
                <span className="text-sm font-black text-emerald-600">{actionCounts.completed}건</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{
                    width: `${actionCounts.total > 0
                      ? (actionCounts.completed / actionCounts.total) * 100
                      : 0
                      }%`,
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full rounded-full" style={{ maskImage: 'linear-gradient(to right, transparent, black)' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 항공사별 상세 통계 */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 overflow-hidden">
        {/* 헤더 */}
        <div className="px-8 py-7 border-b border-slate-100/80 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">항공사별 상세 통계</h3>
          </div>
        </div>

        {/* 테이블 */}
        {airlineDetailStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-8 py-5 text-left text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    항공사
                  </th>
                  <th className="px-8 py-5 text-center text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    호출부호
                  </th>
                  <th className="px-8 py-5 text-center text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    조치율
                  </th>
                  <th className="px-8 py-5 text-center text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    미조치 / 진행중
                  </th>
                  <th className="px-8 py-5 text-left text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    최근 업로드
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {airlineDetailStats.map((stat) => (
                  <tr key={stat.airline.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-800 text-[15px]">{stat.airline.code}</td>
                    <td className="px-8 py-5 text-center font-semibold text-slate-500">
                      {stat.total}개
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold ${stat.completionRate > 80 ? 'bg-emerald-50 text-emerald-600' :
                          stat.completionRate > 40 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {stat.completionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center font-medium">
                      <span className="text-amber-500 font-bold px-2">{stat.pending}</span>
                      <span className="text-slate-200">/</span>
                      <span className="text-indigo-500 font-bold px-2">{stat.inProgress}</span>
                    </td>
                    <td className="px-8 py-5 text-slate-400 font-medium">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-8 py-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Data</p>
          </div>
        )}
      </div>

      {/* 조치 유형별 분포 및 중복 호출부호 분석 */}
      <div className="space-y-8">
        <ActionTypeDistributionChart />
        <DuplicateCallsignsChart />
      </div>
    </div>
  );
}
