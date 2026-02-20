'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ActionModal } from '@/components/actions/ActionModal';
import { useAirlineActions, useAirlineCallsigns } from '@/hooks/useActions';
import { useAirlines } from '@/hooks/useAirlines';
import Link from 'next/link';

export default function AdminActionsPage() {
  const [selectedAirlineId, setSelectedAirlineId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'in_progress' | 'completed' | ''>('');
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [limit] = useState(20);

  // 항공사 목록 조회
  const airlinesQuery = useAirlines();

  // 조치 목록 조회
  const actionsQuery = useAirlineActions({
    airlineId: selectedAirlineId || undefined,
    status: selectedStatus as any,
    page,
    limit,
  });

  // 선택한 항공사의 호출부호 목록
  const callsignsQuery = useAirlineCallsigns(selectedAirlineId, { limit: 100 });

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    in_progress: '#3b82f6',
    completed: '#10b981',
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-900 hover:underline"
            >
              대시보드
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-3xl font-bold text-gray-900">조치 관리</h1>
          </div>
          <p className="text-gray-600">항공사별 조치 이력 관리 및 상태 추적</p>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 항공사 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                항공사
              </label>
              <select
                value={selectedAirlineId}
                onChange={(e) => {
                  setSelectedAirlineId(e.target.value);
                  setPage(1);
                }}
                disabled={airlinesQuery.isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as any);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">모든 상태</option>
                <option value="pending">대기중</option>
                <option value="in_progress">진행중</option>
                <option value="completed">완료</option>
              </select>
            </div>

            {/* 생성 버튼 */}
            <div className="flex items-end">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={!selectedAirlineId}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                조치 등록
              </button>
            </div>
          </div>

          {/* 결과 요약 */}
          {actionsQuery.data && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                전체: <span className="font-semibold">{actionsQuery.data.pagination.total}</span>건
                {selectedStatus && ` / ${statusLabels[selectedStatus]}: `}
                {selectedStatus && (
                  <span className="font-semibold">
                    {actionsQuery.data.data.length}건
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* 조치 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {actionsQuery.isLoading ? (
            <div className="p-8 text-center text-gray-600">로딩 중...</div>
          ) : actionsQuery.error ? (
            <div className="p-8 text-center text-red-600">
              {actionsQuery.error instanceof Error
                ? actionsQuery.error.message
                : '조치 목록 조회 실패'}
            </div>
          ) : (actionsQuery.data?.data.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-gray-600">조치가 없습니다.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    항공사
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    호출부호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    조치 유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    담당자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    등록일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {actionsQuery.data?.data.map((action) => (
                  <tr key={action.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {action.airline?.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{action.callsign?.callsign_pair}</div>
                      <div className="text-xs text-gray-500">
                        위험도:{' '}
                        <span
                          style={{
                            color: riskColors[action.callsign?.risk_level || '낮음'],
                          }}
                        >
                          {action.callsign?.risk_level}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {action.action_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {action.manager_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        style={{
                          backgroundColor: statusColors[action.status],
                          color: '#ffffff',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {statusLabels[action.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(action.registered_at).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 페이지네이션 */}
          {actionsQuery.data && actionsQuery.data.pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="text-sm text-gray-600">
                {page} / {actionsQuery.data.pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage(Math.min(actionsQuery.data.pagination.totalPages, page + 1))
                }
                disabled={page === actionsQuery.data.pagination.totalPages}
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          )}
        </div>
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
    </div>
  );
}
