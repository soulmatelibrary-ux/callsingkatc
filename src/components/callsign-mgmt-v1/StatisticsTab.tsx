'use client';

import { useMemo } from 'react';
import { useCallsigns, useAllActions } from '@/hooks/useActions';
import { useAirlines } from '@/hooks/useAirlines';
import { StatCard } from './StatCard';

export function StatisticsTab() {
  const callsignsQuery = useCallsigns({ limit: 1000 });
  const actionsQuery = useAllActions({ limit: 1000 });
  const airlinesQuery = useAirlines();

  // KPI 데이터 계산
  const stats = useMemo(() => {
    const callsigns = callsignsQuery.data?.data || [];
    const actions = actionsQuery.data?.data || [];

    return {
      totalCallsigns: callsigns.length,
      pending: actions.filter((a) => a.status === 'pending').length,
      inProgress: actions.filter((a) => a.status === 'in_progress').length,
      completed: actions.filter((a) => a.status === 'completed').length,
    };
  }, [callsignsQuery.data, actionsQuery.data]);

  // 위험도별 현황
  const riskStats = useMemo(() => {
    const callsigns = callsignsQuery.data?.data || [];
    return {
      veryHigh: callsigns.filter((c) => c.risk_level === '매우높음').length,
      high: callsigns.filter((c) => c.risk_level === '높음').length,
      low: callsigns.filter((c) => c.risk_level === '낮음').length,
    };
  }, [callsignsQuery.data]);

  // 항공사별 상세 통계
  const airlineDetailStats = useMemo(() => {
    const actionsList = actionsQuery.data?.data || [];
    return airlinesQuery.data?.map((airline) => {
      const actions = actionsList.filter((a) => a.airline_id === airline.id) || [];
      const completed = actions.filter((a) => a.status === 'completed').length;
      const total = actions.length || 1;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      // 평균 대응시간 계산 (간단한 예시)
      const avgDays = actions.length > 0
        ? (actions.reduce((sum, a) => {
            if (a.completed_at && a.registered_at) {
              const diff = new Date(a.completed_at).getTime() - new Date(a.registered_at).getTime();
              return sum + diff / (1000 * 60 * 60 * 24);
            }
            return sum;
          }, 0) / actions.length).toFixed(1)
        : '-';

      return {
        airline,
        total,
        completed,
        completionRate,
        avgDays,
      };
    }) || [];
  }, [airlinesQuery.data, actionsQuery.data]);

  if (callsignsQuery.isLoading || actionsQuery.isLoading) {
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
        <StatCard label="총 호출부호" value={stats.totalCallsigns} color="text-gray-900" />
        <StatCard label="미조치" value={stats.pending} color="text-amber-600" />
        <StatCard label="진행중" value={stats.inProgress} color="text-blue-600" />
        <StatCard label="완료" value={stats.completed} color="text-emerald-600" />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 위험도별 현황 */}
        <div className="bg-white rounded-none shadow-sm border border-gray-100 p-8">
          <h3 className="text-lg font-black text-gray-900 mb-6">위험도별 현황</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">매우높음</span>
                <span className="text-sm font-bold text-red-600">{riskStats.veryHigh}개</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{
                    width: `${stats.totalCallsigns > 0 ? (riskStats.veryHigh / stats.totalCallsigns) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">높음</span>
                <span className="text-sm font-bold text-amber-600">{riskStats.high}개</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{
                    width: `${stats.totalCallsigns > 0 ? (riskStats.high / stats.totalCallsigns) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">낮음</span>
                <span className="text-sm font-bold text-emerald-600">{riskStats.low}개</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${stats.totalCallsigns > 0 ? (riskStats.low / stats.totalCallsigns) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 조치 상태별 현황 */}
        <div className="bg-white rounded-none shadow-sm border border-gray-100 p-8">
          <h3 className="text-lg font-black text-gray-900 mb-6">조치 상태 분포</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">미조치 (Pending)</span>
                <span className="text-sm font-bold text-amber-600">{stats.pending}개</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{
                    width: `${
                      stats.pending + stats.inProgress + stats.completed > 0
                        ? (stats.pending / (stats.pending + stats.inProgress + stats.completed)) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">진행중 (In Progress)</span>
                <span className="text-sm font-bold text-blue-600">{stats.inProgress}개</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${
                      stats.pending + stats.inProgress + stats.completed > 0
                        ? (stats.inProgress / (stats.pending + stats.inProgress + stats.completed)) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">완료 (Completed)</span>
                <span className="text-sm font-bold text-emerald-600">{stats.completed}개</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${
                      stats.pending + stats.inProgress + stats.completed > 0
                        ? (stats.completed / (stats.pending + stats.inProgress + stats.completed)) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 항공사별 상세 통계 */}
      <div className="bg-white rounded-none shadow-sm border border-gray-100">
        {/* 헤더 */}
        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
          <h3 className="text-xl font-black text-gray-900">항공사별 상세 통계</h3>
        </div>

        {/* 테이블 */}
        {airlineDetailStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white">
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase">
                    항공사
                  </th>
                  <th className="px-8 py-4 text-center text-[11px] font-black text-gray-400 uppercase">
                    호출부호
                  </th>
                  <th className="px-8 py-4 text-center text-[11px] font-black text-gray-400 uppercase">
                    조치율
                  </th>
                  <th className="px-8 py-4 text-center text-[11px] font-black text-gray-400 uppercase">
                    평균 대응시간
                  </th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase">
                    최근 업로드
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {airlineDetailStats.map((stat) => (
                  <tr key={stat.airline.id} className="group hover:bg-primary/[0.02]">
                    <td className="px-8 py-5 font-bold text-gray-900">{stat.airline.code}</td>
                    <td className="px-8 py-5 text-center font-medium text-gray-600">
                      {stat.total}개
                    </td>
                    <td className="px-8 py-5 text-center font-bold text-emerald-600">
                      {stat.completionRate.toFixed(1)}%
                    </td>
                    <td className="px-8 py-5 text-center text-gray-600 font-medium">
                      {stat.avgDays}일
                    </td>
                    <td className="px-8 py-5 text-gray-600 font-medium">-</td>
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
      </div>
    </div>
  );
}
