'use client';

import { useMemo, useState } from 'react';
import { useAllActions, useAirlineCallsigns } from '@/hooks/useActions';
import { useAirlines } from '@/hooks/useAirlines';
import { useAuthStore } from '@/store/authStore';
import { ActionModal } from '@/components/actions/ActionModal';
import { ActionDetailModal } from '@/components/actions/ActionDetailModal';
import { Action } from '@/types/action';
import * as XLSX from 'xlsx';

export function ActionsTab() {
  const [selectedAirlineId, setSelectedAirlineId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'in_progress' | 'completed' | ''>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [limit] = useState(20);

  // 인증 상태 확인
  const isAdmin = useAuthStore((s) => s.isAdmin());

  // 항공사 목록 조회
  const airlinesQuery = useAirlines();

  // 전체 조치 목록 조회
  const actionsQuery = useAllActions({
    airlineId: selectedAirlineId || undefined,
    status: selectedStatus as any,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    limit,
  });

  // 선택한 항공사의 호출부호 목록
  const callsignsQuery = useAirlineCallsigns(selectedAirlineId, { limit: 100 });

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    in_progress: 'bg-blue-50 text-blue-600 border-blue-100',
    completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  const statusLabels: Record<string, string> = {
    pending: '대기중',
    in_progress: '진행중',
    completed: '완료',
  };

  const riskColors: Record<string, string> = {
    '매우높음': '#dc2626',
    '높음': '#f59e0b',
    '낮음': '#16a34a',
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
    if (!actionsQuery.data?.data) return;
    const rows = actionsQuery.data.data.map((a) => ({
      '항공사': a.airline?.code || '-',
      '호출부호 쌍': a.callsign?.callsign_pair,
      '위험도': a.callsign?.risk_level,
      '조치 유형': a.action_type,
      '담당자': a.manager_name || '-',
      '상태': statusLabels[a.status],
      '등록일': new Date(a.registered_at).toLocaleDateString('ko-KR'),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '조치목록');
    XLSX.writeFile(wb, `조치목록_${new Date().toLocaleDateString('ko-KR')}.xlsx`);
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

  if (actionsQuery.error) {
    return (
      <div className="py-20 text-center text-red-600">
        {actionsQuery.error instanceof Error ? actionsQuery.error.message : '조치 목록 조회 실패'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-none shadow-sm border border-gray-100">
        {/* 헤더 */}
        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
          <h3 className="text-xl font-black text-gray-900">조치 현황</h3>
        </div>

        {/* 필터 */}
        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 항공사 필터 */}
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">
                항공사
              </label>
              <select
                value={selectedAirlineId}
                onChange={(e) => {
                  setSelectedAirlineId(e.target.value);
                  setPage(1);
                }}
                disabled={airlinesQuery.isLoading}
                className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold shadow-sm transition-all"
              >
                <option value="">모든 항공사</option>
                {airlinesQuery.data?.map((airline) => (
                  <option key={airline.id} value={airline.id}>
                    {airline.code} - {airline.name_ko}
                  </option>
                ))}
              </select>
            </div>

            {/* 상태 필터 */}
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">
                상태
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as any);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold shadow-sm transition-all"
              >
                <option value="">모든 상태</option>
                <option value="pending">대기중</option>
                <option value="in_progress">진행중</option>
                <option value="completed">완료</option>
              </select>
            </div>

            {/* 시작 날짜 */}
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">
                시작 날짜
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold shadow-sm transition-all"
              />
            </div>

            {/* 종료 날짜 */}
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">
                종료 날짜
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold shadow-sm transition-all"
              />
            </div>

            {/* 초기화 버튼 */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedAirlineId('');
                  setSelectedStatus('');
                  setDateFrom('');
                  setDateTo('');
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 rounded-none transition-all"
              >
                초기화
              </button>
            </div>
          </div>

          {/* 액션 버튼 */}
          {isAdmin && (
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={!selectedAirlineId}
                className="px-6 py-2 bg-primary text-white font-bold hover:opacity-90 rounded-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                조치 등록
              </button>
              <button
                onClick={handleExportExcel}
                disabled={!actionsQuery.data?.data || actionsQuery.data.data.length === 0}
                className="px-6 py-2 bg-emerald-600 text-white font-bold hover:opacity-90 rounded-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📊 Excel 내보내기
              </button>
            </div>
          )}

          {/* 결과 요약 */}
          {actionsQuery.data && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-[13px] text-gray-600 font-bold">
                전체: <span className="text-primary">{actionsQuery.data.pagination.total}</span>건
                {selectedStatus && ` / ${statusLabels[selectedStatus]}: `}
                {selectedStatus && (
                  <span className="text-primary">{actions.length}건</span>
                )}
              </p>
            </div>
          )}
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
                    위험도
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
                  <tr
                    key={action.id}
                    className={`group hover:bg-primary/[0.02] transition-all ${isAdmin ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (isAdmin) setSelectedAction(action);
                    }}
                  >
                    <td className="px-8 py-5 font-bold text-gray-900">
                      {action.airline?.code || airlineMap[action.airline_id]?.code || '-'}
                    </td>
                    <td className="px-8 py-5 font-medium text-gray-700">
                      {action.callsign?.callsign_pair || '-'}
                    </td>
                    <td className="px-8 py-5 text-gray-600 font-medium">
                      <span style={{ color: riskColors[action.callsign?.risk_level || '낮음'] }}>
                        {action.callsign?.risk_level || '-'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-gray-600 font-medium">
                      {action.action_type || '-'}
                    </td>
                    <td className="px-8 py-5 text-gray-600 font-medium">
                      {action.manager_name || '-'}
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border ${statusColors[action.status] || 'bg-gray-50 text-gray-600 border-gray-100'
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
            <p className="text-sm font-bold text-gray-400 uppercase">조치가 없습니다.</p>
          </div>
        )}

        {/* 푸터 */}
        {actionsQuery.data && actionsQuery.data.pagination.totalPages > 1 && (
          <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              페이지 {page} / {actionsQuery.data.pagination.totalPages}
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-200 rounded-none hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
              >
                이전
              </button>
              <button
                onClick={() => setPage(Math.min(actionsQuery.data?.pagination.totalPages || 1, page + 1))}
                disabled={page === actionsQuery.data?.pagination.totalPages}
                className="px-3 py-1 border border-gray-200 rounded-none hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 조치 등록 모달 */}
      {isCreateModalOpen && selectedAirlineId && (
        <ActionModal
          airlineId={selectedAirlineId}
          callsigns={callsignsQuery.data?.data || []}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            actionsQuery.refetch();
          }}
        />
      )}

      {/* 조치 수정 모달 */}
      {selectedAction && isAdmin && (
        <ActionDetailModal
          action={selectedAction}
          onClose={() => setSelectedAction(null)}
          onSuccess={() => {
            actionsQuery.refetch();
          }}
        />
      )}
    </div>
  );
}
