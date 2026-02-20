'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/lib/constants';
import { Header } from '@/components/layout/Header';
import { useAirlineCallsigns, useAirlineActions, useDeleteAction } from '@/hooks/useActions';
import { ActionDetailModal } from '@/components/actions/ActionDetailModal';
import { Action } from '@/types/action';
import * as XLSX from 'xlsx';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin } = useAuthStore((s) => ({
    user: s.user,
    isAuthenticated: s.isAuthenticated(),
    isAdmin: s.isAdmin(),
  }));

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // 호출부호 필터
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('');
  const [callsignPage, setCallsignPage] = useState(1);

  // 조치 이력 필터 (기본값: 1개월)
  const getDefaultDateFrom = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  };

  const [actionStatusFilter, setActionStatusFilter] = useState<'pending' | 'in_progress' | 'completed' | ''>('');
  const [actionDateFrom, setActionDateFrom] = useState(getDefaultDateFrom());
  const [actionDateTo, setActionDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [actionPage, setActionPage] = useState(1);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null);

  // 조치 삭제
  const deleteActionMutation = useDeleteAction();

  // 호출부호 목록 조회 (사용자의 항공사별)
  const callsignsQuery = useAirlineCallsigns(user?.airline_id, {
    riskLevel: riskLevelFilter || undefined,
    page: callsignPage,
    limit: 20,
  });

  // 조치 이력 조회 (사용자의 항공사별, 기본값 1개월)
  const actionsQuery = useAirlineActions({
    airlineId: user?.airline_id,
    status: actionStatusFilter as any,
    dateFrom: actionDateFrom || undefined,
    dateTo: actionDateTo || undefined,
    page: actionPage,
    limit: 20,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.HOME);
      return;
    }
  }, [isAuthenticated, router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const accessToken = useAuthStore.getState().accessToken;
      const response = await fetch('/api/admin/upload-callsigns', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          message: `업로드 완료: 총 ${result.total}건 중 ${result.inserted}건 신규, ${result.updated}건 업데이트`,
          details: result,
        });
        setSelectedFile(null);
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setUploadResult({
          success: false,
          message: result.error || '업로드 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!confirm('이 조치를 삭제하시겠습니까?')) {
      return;
    }

    setDeletingActionId(actionId);
    try {
      await deleteActionMutation.mutateAsync(actionId);
      await actionsQuery.refetch();
    } finally {
      setDeletingActionId(null);
    }
  };

  // 날짜 범위 설정 함수
  const setDateRange = (days: number | 'today') => {
    const to = new Date();
    const from = new Date();

    if (days === 'today') {
      from.setHours(0, 0, 0, 0);
    } else {
      from.setDate(from.getDate() - days);
    }

    setActionDateFrom(from.toISOString().split('T')[0]);
    setActionDateTo(to.toISOString().split('T')[0]);
    setActionPage(1);
  };

  const riskColors: Record<string, string> = {
    '매우높음': '#dc2626',
    '높음': '#f59e0b',
    '낮음': '#16a34a',
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-24 pb-10">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
          <p className="text-gray-600">
            {user?.airline?.code
              ? `${user.airline.code} 항공사의 유사호출부호 현황을 확인하세요.`
              : '유사호출부호 현황을 확인하세요.'}
          </p>
        </div>

        {/* 호출부호 목록 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-gray-900">유사호출부호 목록</h2>
            <button
              onClick={() => setIsUploadModalOpen(!isUploadModalOpen)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {isUploadModalOpen ? 'Excel 업로드 닫기' : 'Excel 업로드'}
            </button>
          </div>

          {/* 필터 UI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* 위험도 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                위험도
              </label>
              <select
                value={riskLevelFilter}
                onChange={(e) => {
                  setRiskLevelFilter(e.target.value);
                  setCallsignPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="매우높음">매우높음</option>
                <option value="높음">높음</option>
                <option value="낮음">낮음</option>
              </select>
            </div>

            {/* 초기화 버튼 */}
            <div>
              <button
                onClick={() => {
                  setRiskLevelFilter('');
                  setCallsignPage(1);
                }}
                className="w-full px-4 py-2 mt-6 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                초기화
              </button>
            </div>

            {/* Excel 내보내기 */}
            <div>
              <button
                onClick={() => {
                  if (!callsignsQuery.data?.data) return;
                  const rows = callsignsQuery.data.data.map((cs) => ({
                    '호출부호 쌍': cs.callsign_pair,
                    '자신 호출부호': cs.my_callsign,
                    '타사 호출부호': cs.other_callsign,
                    '위험도': cs.risk_level,
                    '유사도': cs.similarity,
                    '발생 횟수': cs.occurrence_count,
                    '마지막 발생일': cs.last_occurred_at
                      ? new Date(cs.last_occurred_at).toLocaleDateString('ko-KR')
                      : '-',
                  }));
                  const ws = XLSX.utils.json_to_sheet(rows);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, '호출부호목록');
                  XLSX.writeFile(
                    wb,
                    `${user?.airline?.code || '항공사'}_호출부호목록_${new Date().toLocaleDateString('ko-KR')}.xlsx`
                  );
                }}
                disabled={!callsignsQuery.data?.data || callsignsQuery.data.data.length === 0}
                className="w-full px-4 py-2 mt-6 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                내보내기
              </button>
            </div>
          </div>

          {/* 호출부호 테이블 */}
          {callsignsQuery.isLoading ? (
            <div className="p-8 text-center text-gray-600">로딩 중...</div>
          ) : callsignsQuery.error ? (
            <div className="p-8 text-center text-red-600">
              {callsignsQuery.error instanceof Error
                ? callsignsQuery.error.message
                : '호출부호 목록 조회 실패'}
            </div>
          ) : (callsignsQuery.data?.data.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-gray-600">호출부호가 없습니다.</div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      호출부호 쌍
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      위험도
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      유사도
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      발생 횟수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      마지막 발생일
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {callsignsQuery.data?.data.map((cs) => (
                    <tr key={cs.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        <div className="font-medium">{cs.callsign_pair}</div>
                        <div className="text-xs text-gray-500">
                          {cs.my_callsign} / {cs.other_callsign}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          style={{
                            color: riskColors[cs.risk_level || '낮음'],
                            fontWeight: 600,
                          }}
                        >
                          {cs.risk_level || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {cs.similarity || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {cs.occurrence_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {cs.last_occurred_at
                          ? new Date(cs.last_occurred_at).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 페이지네이션 */}
              {callsignsQuery.data && callsignsQuery.data.pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between mt-4">
                  <button
                    onClick={() => setCallsignPage(Math.max(1, callsignPage - 1))}
                    disabled={callsignPage === 1}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  <span className="text-sm text-gray-600">
                    {callsignPage} / {callsignsQuery.data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCallsignPage(
                        Math.min(callsignsQuery.data.pagination.totalPages, callsignPage + 1)
                      )
                    }
                    disabled={callsignPage === callsignsQuery.data.pagination.totalPages}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 조치 이력 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          {/* 헤더 */}
          <h2 className="text-xl font-bold text-gray-900 mb-6">조치 이력</h2>

          {/* 상태별 탭 */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => {
                setActionStatusFilter('');
                setActionPage(1);
              }}
              className={`px-4 py-3 font-medium transition-colors ${
                actionStatusFilter === ''
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => {
                setActionStatusFilter('pending');
                setActionPage(1);
              }}
              className={`px-4 py-3 font-medium transition-colors ${
                actionStatusFilter === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              대기중
            </button>
            <button
              onClick={() => {
                setActionStatusFilter('in_progress');
                setActionPage(1);
              }}
              className={`px-4 py-3 font-medium transition-colors ${
                actionStatusFilter === 'in_progress'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              진행중
            </button>
            <button
              onClick={() => {
                setActionStatusFilter('completed');
                setActionPage(1);
              }}
              className={`px-4 py-3 font-medium transition-colors ${
                actionStatusFilter === 'completed'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              완료
            </button>
          </div>

          {/* 날짜 필터 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일
              </label>
              <input
                type="date"
                value={actionDateFrom}
                onChange={(e) => {
                  setActionDateFrom(e.target.value);
                  setActionPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료일
              </label>
              <input
                type="date"
                value={actionDateTo}
                onChange={(e) => {
                  setActionDateTo(e.target.value);
                  setActionPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setActionDateFrom(getDefaultDateFrom());
                  setActionDateTo(new Date().toISOString().split('T')[0]);
                  setActionPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                초기화
              </button>
            </div>
          </div>

          {/* 날짜 범위 단축 버튼 및 검색 */}
          <div className="flex gap-2 mb-6 flex-wrap items-center">
            <button
              onClick={() => setDateRange('today')}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              오늘
            </button>
            <button
              onClick={() => setDateRange(7)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              최근1주
            </button>
            <button
              onClick={() => setDateRange(14)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              최근2주
            </button>
            <button
              onClick={() => setDateRange(30)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              최근1개월
            </button>

            <div className="flex-1"></div>

            <button
              onClick={() => actionsQuery.refetch()}
              disabled={actionsQuery.isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium text-sm"
            >
              {actionsQuery.isLoading ? '검색중...' : '검색'}
            </button>
          </div>

          {/* 조치 이력 테이블 */}
          {actionsQuery.isLoading ? (
            <div className="p-8 text-center text-gray-600">로딩 중...</div>
          ) : actionsQuery.error ? (
            <div className="p-8 text-center text-red-600">
              {actionsQuery.error instanceof Error
                ? actionsQuery.error.message
                : '조치 이력 조회 실패'}
            </div>
          ) : (actionsQuery.data?.data.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-gray-600">조치 이력이 없습니다.</div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      상세
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        삭제
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {actionsQuery.data?.data.map((action) => (
                    <tr key={action.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">
                        <div className="font-medium">{action.callsign?.callsign_pair}</div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-600">발생건수</div>
                            <div className="font-semibold text-gray-900">
                              {action.callsign?.occurrence_count || 0}건
                            </div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-600">최근 발생일</div>
                            <div className="font-semibold text-gray-900">
                              {action.callsign?.last_occurred_at
                                ? new Date(action.callsign.last_occurred_at).toLocaleDateString('ko-KR')
                                : '-'}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-600">원인사</div>
                            <div className="font-semibold text-gray-900 text-red-600">
                              {action.callsign?.error_type || '-'}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-600">위험도</div>
                            <div
                              className="font-semibold"
                              style={{ color: riskColors[action.callsign?.risk_level || '낮음'] }}
                            >
                              {action.callsign?.risk_level || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {action.action_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedAction(action)}
                          className="px-3 py-1 text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-600 rounded hover:bg-blue-50"
                        >
                          상세보기
                        </button>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteAction(action.id)}
                            disabled={deletingActionId === action.id || deleteActionMutation.isPending}
                            className="px-3 py-1 text-red-600 hover:text-red-800 font-medium text-sm border border-red-600 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingActionId === action.id ? '삭제 중...' : '삭제'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 페이지네이션 */}
              {actionsQuery.data && actionsQuery.data.pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between mt-4">
                  <button
                    onClick={() => setActionPage(Math.max(1, actionPage - 1))}
                    disabled={actionPage === 1}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  <span className="text-sm text-gray-600">
                    {actionPage} / {actionsQuery.data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setActionPage(Math.min(actionsQuery.data.pagination.totalPages, actionPage + 1))
                    }
                    disabled={actionPage === actionsQuery.data.pagination.totalPages}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Excel 업로드 섹션 (토글 가능) */}
        {isUploadModalOpen && (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">유사호출부호 데이터 업로드</h2>
              <p className="text-sm text-gray-600 mb-6">
                Excel 파일(.xlsx, .xls)로 유사호출부호 데이터를 일괄 업로드할 수 있습니다.
              </p>

              {/* 파일 선택 */}
              <div className="mb-6">
                <label
                  htmlFor="file-input"
                  className="block w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="text-center">
                    {selectedFile ? (
                      <>
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-700">파일을 선택하거나 드래그하세요</p>
                        <p className="text-xs text-gray-500 mt-1">.xlsx, .xls 파일</p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* 업로드 버튼 */}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? '업로드 중...' : '업로드'}
              </button>

              {/* 업로드 결과 */}
              {uploadResult && (
                <div
                  className={`mt-6 p-4 rounded-lg ${
                    uploadResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      uploadResult.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {uploadResult.message}
                  </p>
                  {uploadResult.details?.errors && uploadResult.details.errors.length > 0 && (
                    <div className="mt-3 text-xs text-red-700">
                      <p className="font-semibold mb-1">오류 내역:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {uploadResult.details.errors.map((err: string, idx: number) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {uploadResult.success && (
                    <button
                      onClick={() => router.push('/airline')}
                      className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      → 유사호출부호 목록 보기
                    </button>
                  )}
                </div>
              )}

              {/* 안내사항 */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 Excel 형식 안내</h3>
                <div className="text-xs text-gray-600 space-y-2 text-left">
                  <p>• <strong>국내 항공사</strong> 데이터만 자동으로 필터링됩니다</p>
                  <p>• <strong>편명1 또는 편명2</strong> 중 국내 항공사 코드를 자동 추출합니다</p>
                  <p>• <strong>유사도</strong>와 <strong>오류발생가능성</strong> 정보가 자동 매핑됩니다</p>
                  <p>• 중복된 유사호출부호 쌍은 자동으로 업데이트됩니다</p>
                  <p className="mt-3 pt-3 border-t border-gray-300">
                    <strong>필수 컬럼:</strong> 편명1, 편명2가 필수이며, 나머지는 선택 사항입니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 조치 상세 모달 */}
        {selectedAction && (
          <ActionDetailModal
            action={selectedAction}
            onClose={() => setSelectedAction(null)}
            onSuccess={() => {
              actionsQuery.refetch();
            }}
          />
        )}
      </main>
    </div>
  );
}
