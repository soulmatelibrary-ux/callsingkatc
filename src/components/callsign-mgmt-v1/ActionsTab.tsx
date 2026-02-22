'use client';

import { useMemo } from 'react';
import { useAllActions } from '@/hooks/useActions';
import { useAirlines } from '@/hooks/useAirlines';
import * as XLSX from 'xlsx';

export function ActionsTab() {
  const airlinesQuery = useAirlines();
  const actionsQuery = useAllActions({ limit: 1000 });

  // 항공사별 조치 현황 계산
  const airlineStats = useMemo(() => {
    const actionsList = actionsQuery.data?.data || [];
    return airlinesQuery.data?.map((airline) => {
      const actions = actionsList.filter((a) => a.airline_id === airline.id) || [];
      const completed = actions.filter((a) => a.status === 'completed').length;
      const total = actions.length || 1; // 0으로 나누기 방지
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        airline,
        total,
        completed,
        pending: actions.filter((a) => a.status === 'pending').length,
        inProgress: actions.filter((a) => a.status === 'in_progress').length,
        completionRate,
      };
    }) || [];
  }, [airlinesQuery.data, actionsQuery.data]);

  // 조치율 기준 정렬 (낮은 순)
  const sortedStats = useMemo(() => {
    return [...airlineStats].sort((a, b) => a.completionRate - b.completionRate);
  }, [airlineStats]);

  const handleExportExcel = () => {
    const data = sortedStats.map((stat) => ({
      항공사: stat.airline.name_ko,
      호출부호: stat.total,
      조치율: `${stat.completionRate.toFixed(1)}%`,
      대기: stat.pending,
      진행중: stat.inProgress,
      완료: stat.completed,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `항공사_현황_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (actionsQuery.isLoading) {
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
      <div className="bg-white rounded-none shadow-sm border border-gray-100">
        {/* 헤더 */}
        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
          <h3 className="text-xl font-black text-gray-900">항공사 조치 현황</h3>
        </div>

        {/* 테이블 */}
        {sortedStats.length > 0 ? (
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
                    대기
                  </th>
                  <th className="px-8 py-4 text-center text-[11px] font-black text-gray-400 uppercase">
                    진행중
                  </th>
                  <th className="px-8 py-4 text-center text-[11px] font-black text-gray-400 uppercase">
                    완료
                  </th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedStats.map((stat) => {
                  const getStatusColor = (rate: number) => {
                    if (rate >= 80)
                      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
                    if (rate >= 50) return 'bg-amber-50 text-amber-600 border-amber-100';
                    return 'bg-red-50 text-red-600 border-red-100';
                  };

                  const getStatusLabel = (rate: number) => {
                    if (rate >= 80) return '우수';
                    if (rate >= 50) return '양호';
                    return '주의';
                  };

                  const getProgressColor = (rate: number) => {
                    if (rate >= 80) return 'bg-emerald-500';
                    if (rate >= 50) return 'bg-amber-500';
                    return 'bg-red-500';
                  };

                  return (
                    <tr key={stat.airline.id} className="group hover:bg-primary/[0.02]">
                      <td className="px-8 py-5 font-bold text-gray-900">
                        {stat.airline.code}
                      </td>
                      <td className="px-8 py-5 text-center font-medium text-gray-600">
                        {stat.total}개
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${getProgressColor(
                                stat.completionRate
                              )}`}
                              style={{ width: `${stat.completionRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-sm min-w-12 text-right">
                            {stat.completionRate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center font-bold text-amber-600">
                        {stat.pending}
                      </td>
                      <td className="px-8 py-5 text-center font-bold text-blue-600">
                        {stat.inProgress}
                      </td>
                      <td className="px-8 py-5 text-center font-bold text-emerald-600">
                        {stat.completed}
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border ${getStatusColor(
                            stat.completionRate
                          )}`}
                        >
                          {getStatusLabel(stat.completionRate)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-8 py-12 text-center">
            <p className="text-sm font-bold text-gray-400 uppercase">No Data</p>
          </div>
        )}

        {/* 푸터 */}
        <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/30 flex justify-end gap-3">
          <button
            onClick={handleExportExcel}
            className="px-6 py-2 bg-primary text-white font-bold hover:opacity-90 rounded-none transition-all"
          >
            📊 Excel 내보내기
          </button>
        </div>
      </div>
    </div>
  );
}
