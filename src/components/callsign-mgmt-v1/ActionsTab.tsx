'use client';

import { useMemo, useState } from 'react';
import { useAllActions } from '@/hooks/useActions';
import { useAirlines } from '@/hooks/useAirlines';
import * as XLSX from 'xlsx';

export function ActionsTab() {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const actionsQuery = useAllActions({
    status: (selectedStatus as any) || undefined,
    page,
    limit,
  });
  const airlinesQuery = useAirlines();

  // 상태별 색상 및 라벨
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    in_progress: 'bg-blue-50 text-blue-600 border-blue-100',
    completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  const statusLabels: Record<string, string> = {
    pending: '대기중',
    in_progress: '진행중',
    completed: '완료',
  };

  // 항공사 맵 생성
  const airlineMap = useMemo(() => {
    return (airlinesQuery.data || []).reduce((acc, airline) => {
      acc[airline.id] = airline;
      return acc;
    }, {} as Record<string, any>);
  }, [airlinesQuery.data]);

  const actions = useMemo(() => {
    return actionsQuery.data?.data || [];
  }, [actionsQuery.data]);

  const handleExportExcel = () => {
    const data = (actions || []).map((action) => ({
      항공사: airlineMap[action.airline_id]?.code || '-',
      호출부호: action.callsign?.callsign_pair || '-',
      조치유형: action.action_type || '-',
      담당자: action.manager_name || '-',
      상태: statusLabels[action.status] || action.status,
      등록일: action.registered_at
        ? new Date(action.registered_at).toLocaleDateString('ko-KR')
        : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '조치');
    XLSX.writeFile(wb, `조치현황_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    <div className="space-y-6">
      <div className="bg-white rounded-none shadow-sm border border-gray-100">
        {/* 헤더 */}
        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
          <h3 className="text-xl font-black text-gray-900">항공사 조치 현황</h3>
        </div>

        {/* 필터 */}
        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
          <div className="flex gap-3 items-center">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
            >
              <option value="">상태 선택</option>
              <option value="pending">대기중</option>
              <option value="in_progress">진행중</option>
              <option value="completed">완료</option>
            </select>
            <button
              onClick={() => {
                setSelectedStatus('');
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 rounded-none transition-all"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 테이블 */}
        {(actions?.length || 0) > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white">
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    항공사
                  </th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    호출부호
                  </th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    조치유형
                  </th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    담당자
                  </th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    상태
                  </th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    등록일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {actions.map((action) => (
                  <tr key={action.id} className="group hover:bg-primary/[0.02] transition-all">
                    <td className="px-8 py-5 font-bold text-gray-900">
                      {airlineMap[action.airline_id]?.code || '-'}
                    </td>
                    <td className="px-8 py-5 font-medium text-gray-700">
                      {action.callsign?.callsign_pair || '-'}
                    </td>
                    <td className="px-8 py-5 text-gray-600 font-medium">
                      {action.action_type || '-'}
                    </td>
                    <td className="px-8 py-5 text-gray-600 font-medium">
                      {action.manager_name || '-'}
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border ${
                          statusColors[action.status] || 'bg-gray-50 text-gray-600 border-gray-100'
                        }`}
                      >
                        {statusLabels[action.status] || action.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-gray-400 font-medium">
                      {action.registered_at
                        ? new Date(action.registered_at).toLocaleDateString('ko-KR', {
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

        {/* 푸터 */}
        <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            페이지 {page}
          </span>
          <div className="flex gap-3">
            <button
              onClick={handleExportExcel}
              className="px-6 py-2 bg-primary text-white font-bold hover:opacity-90 rounded-none transition-all"
            >
              📊 Excel 내보내기
            </button>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-200 rounded-none hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
            >
              이전
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(actions?.length || 0) < limit}
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
