'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAnnouncementHistory, useAdminAnnouncements } from '@/hooks/useAnnouncements';
import { ANNOUNCEMENT_LEVEL_COLORS, ANNOUNCEMENT_LEVEL } from '@/lib/constants';
import { AnnouncementHistoryFilters, AdminAnnouncementFilters } from '@/types/announcement';

interface Props {
  isAdmin?: boolean;
  initialFilters?: AnnouncementHistoryFilters | AdminAnnouncementFilters;
  onSelectAnnouncement?: (announcement: any) => void;
}

/**
 * 현재 월의 1일부터 오늘까지의 기본 날짜 범위 계산
 */
function getDefaultDateRange(): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const dateFrom = firstDay.toISOString().split('T')[0];
  const dateTo = today.toISOString().split('T')[0];

  return { dateFrom, dateTo };
}

/**
 * AnnouncementTable - 공지사항 이력 테이블
 *
 * 기능:
 * - 필터: 긴급도, 상태, 기간 (기본값: 현재 월 1일부터 오늘까지)
 * - 페이지네이션
 * - 읽음 여부 표시
 * - 관리자/사용자 모드
 */
export function AnnouncementTable({ isAdmin = false, initialFilters = {}, onSelectAnnouncement }: Props) {
  const defaultDates = getDefaultDateRange();

  // 필터 상태
  const [filters, setFilters] = useState<
    AnnouncementHistoryFilters | AdminAnnouncementFilters
  >({
    level: undefined,
    status: 'all',
    dateFrom: defaultDates.dateFrom,
    dateTo: defaultDates.dateTo,
    page: 1,
    limit: 20,
    ...initialFilters,
  });

  // 데이터 조회 (역할별로 필요한 훅만 호출)
  // TanStack Query v5는 enabled 옵션을 직접 지원하지 않으므로,
  // 역할에 맞는 훅만 호출하도록 로직 분리
  const adminData = useAdminAnnouncements(
    filters as AdminAnnouncementFilters
  );
  const userData = useAnnouncementHistory(
    filters as AnnouncementHistoryFilters
  );

  // 사용하지 않는 훅의 데이터는 로드되지 않음 (enabled=false와 같은 효과)
  const { data, isLoading } = isAdmin ? adminData : userData;

  const announcements = data?.announcements || [];
  const total = data?.total || 0;
  const page = data?.page || 1;
  const limit = data?.limit || 20;
  const totalPages = Math.ceil(total / limit);

  // 필터 변경 핸들러
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // 필터 변경 시 첫 페이지로
    }));
  };

  // 필터 초기화
  const handleResetFilters = () => {
    const defaultDates = getDefaultDateRange();
    setFilters({
      level: undefined,
      status: 'all',
      dateFrom: defaultDates.dateFrom,
      dateTo: defaultDates.dateTo,
      page: 1,
      limit: 20,
    });
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  return (
    <div className="space-y-4">
      {/* 필터 바 */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">필터</h3>
          <button
            onClick={handleResetFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            초기화
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              검색 (제목/내용)
            </label>
            <input
              type="text"
              placeholder="검색어 입력..."
              value={(filters as any).search || ''}
              onChange={e => handleFilterChange('search', e.target.value || undefined)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* 긴급도 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              긴급도
            </label>
            <select
              value={(filters.level as string) || ''}
              onChange={e => handleFilterChange('level', e.target.value || undefined)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">전체</option>
              <option value="warning">경고</option>
              <option value="info">일반</option>
              <option value="success">완료</option>
            </select>
          </div>

          {/* 상태 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상태
            </label>
            <select
              value={filters.status || 'all'}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="expired">종료</option>
            </select>
          </div>

          {/* 시작 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시작일
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={e => handleFilterChange('dateFrom', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* 종료 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              종료일
            </label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={e => handleFilterChange('dateTo', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="text-sm text-gray-600">
        총 <span className="font-semibold">{total}</span>개 공지사항
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">로드 중...</div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            공지사항이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                    제목
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                    긴급도
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                    상태
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                      읽음
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                    기간
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                    작성일
                  </th>
                </tr>
              </thead>
              <tbody>
                {announcements.map(announcement => {
                  const colors = ANNOUNCEMENT_LEVEL_COLORS[announcement.level];
                  const isActive =
                    new Date(announcement.startDate) <= new Date() &&
                    new Date(announcement.endDate) >= new Date();

                  return (
                    <tr
                      key={announcement.id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      {/* 제목 */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onSelectAnnouncement?.(announcement)}
                          className="text-blue-600 hover:underline font-medium text-left"
                        >
                          {announcement.title}
                        </button>
                      </td>

                      {/* 긴급도 */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${colors.badge}`}
                        >
                          {getAnnouncementLevelLabel(announcement.level)}
                        </span>
                      </td>

                      {/* 상태 */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${
                            isActive
                              ? 'text-green-700'
                              : 'text-gray-500'
                          }`}
                        >
                          {isActive ? '활성' : '종료'}
                        </span>
                      </td>

                      {/* 읽음 (관리자만) */}
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600">
                            {(announcement as any).viewCount || 0}명
                          </span>
                        </td>
                      )}

                      {/* 기간 */}
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {formatDateRange(
                          announcement.startDate,
                          announcement.endDate
                        )}
                      </td>

                      {/* 작성일 */}
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {new Date(announcement.createdAt).toLocaleDateString(
                          'ko-KR'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            이전
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
              .map(p => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`px-3 py-2 rounded ${
                    p === page
                      ? 'bg-blue-500 text-white'
                      : 'border hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
          </div>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 긴급도 라벨
 */
function getAnnouncementLevelLabel(level: string): string {
  switch (level) {
    case 'warning':
      return '🚨 경고';
    case 'success':
      return '✅ 완료';
    case 'info':
    default:
      return '📢 일반';
  }
}

/**
 * 날짜 범위 포맷
 */
function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
  const end = new Date(endDate).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
  return `${start} ~ ${end}`;
}
