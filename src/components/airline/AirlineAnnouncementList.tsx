'use client';

import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useAnnouncementHistory, announcementQueryKeys } from '@/hooks/useAnnouncements';
import {
  ANNOUNCEMENT_LEVEL_META,
  ANNOUNCEMENT_STATUS_META,
} from '@/types/airline';
import { formatAnnouncementPeriod, truncateText } from '@/hooks/useDateRangeFilter';
import { Announcement } from '@/types/announcement';
import { ChevronDown } from 'lucide-react';

interface AirlineAnnouncementListProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showLevelFilter?: boolean;
  showStatusFilter?: boolean;
  onViewAll?: () => void;
  defaultLimit?: number;
  initialStatus?: 'active' | 'expired' | 'all';
}

// 공지사항 히스토리는 status, isViewed 필드가 포함됨
type AnnouncementWithStatus = Announcement & {
  status?: 'active' | 'expired';
  isViewed?: boolean;
};

export function AirlineAnnouncementList({
  title = '공지사항',
  subtitle,
  showSearch = true,
  showLevelFilter = true,
  showStatusFilter = false,
  onViewAll,
  defaultLimit = 10,
  initialStatus = 'all',
}: AirlineAnnouncementListProps) {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  // 필터 및 페이지네이션 상태
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'warning' | 'info' | 'success' | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'expired' | 'all'>(initialStatus);
  const [currentPage, setCurrentPage] = useState(1);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // API 쿼리 파라미터 구성
  const filters = useMemo(
    () => ({
      level: levelFilter !== 'all' ? levelFilter : undefined,
      status: (statusFilter !== 'all' ? statusFilter : 'all') as 'active' | 'expired' | 'all',
      search: search || undefined,
      page: currentPage,
      limit: defaultLimit,
    }),
    [levelFilter, statusFilter, search, currentPage, defaultLimit]
  );

  // 데이터 조회
  const { data, isLoading, error } = useAnnouncementHistory(filters);

  // 검색 실행
  const handleSearch = () => {
    setSearch(searchInput);
    setCurrentPage(1);
  };

  // 엔터키로 검색
  const handleSearchKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 필터 변경 시 페이지 1로 리셋
  const handleLevelFilterChange = (level: 'warning' | 'info' | 'success' | 'all') => {
    setLevelFilter(level);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: 'active' | 'expired' | 'all') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // 공지사항 읽음 처리
  const handleMarkAsRead = async (announcementId: string) => {
    if (!accessToken) return;

    setMarkingAsRead(announcementId);
    try {
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // 캐시 무효화하여 목록 업데이트
        queryClient.invalidateQueries({
          queryKey: ['announcements', 'history'],
        });
      }
    } catch (error) {
      console.error('Failed to mark announcement as read:', error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  // 데이터 처리
  const announcements = (data?.announcements || []) as AnnouncementWithStatus[];
  const totalPages = data ? Math.ceil(data.total / (data.limit || defaultLimit)) : 1;

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-900 tracking-tight">
            {title}
          </h3>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="px-4 py-2 border border-gray-200 rounded-none text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
          >
            전체 보기
          </button>
        )}
      </div>

      {/* 검색 및 필터 */}
      <div className="space-y-4 pb-4 border-b border-gray-100">
        {showSearch && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="제목, 내용으로 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeydown}
              className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded hover:bg-primary/90 transition"
            >
              검색
            </button>
          </div>
        )}

        {/* 필터 버튼 */}
        <div className="flex flex-wrap gap-2">
          {showLevelFilter && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleLevelFilterChange('all')}
                className={`px-3 py-1 text-xs font-semibold rounded transition ${
                  levelFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => handleLevelFilterChange('warning')}
                className={`px-3 py-1 text-xs font-semibold rounded transition ${
                  levelFilter === 'warning'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                긴급
              </button>
              <button
                type="button"
                onClick={() => handleLevelFilterChange('info')}
                className={`px-3 py-1 text-xs font-semibold rounded transition ${
                  levelFilter === 'info'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                일반
              </button>
              <button
                type="button"
                onClick={() => handleLevelFilterChange('success')}
                className={`px-3 py-1 text-xs font-semibold rounded transition ${
                  levelFilter === 'success'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                완료
              </button>
            </div>
          )}

          {showStatusFilter && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleStatusFilterChange('all')}
                className={`px-3 py-1 text-xs font-semibold rounded transition ${
                  statusFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('active')}
                className={`px-3 py-1 text-xs font-semibold rounded transition ${
                  statusFilter === 'active'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                진행중
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('expired')}
                className={`px-3 py-1 text-xs font-semibold rounded transition ${
                  statusFilter === 'expired'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                종료
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-400 font-semibold">
          공지사항을 불러오는 중입니다...
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-500 font-semibold">
          공지사항 조회에 실패했습니다.
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-12 text-center text-gray-400 font-semibold">
          공지사항이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => {
            const levelMeta =
              ANNOUNCEMENT_LEVEL_META[
                item.level as keyof typeof ANNOUNCEMENT_LEVEL_META
              ] || ANNOUNCEMENT_LEVEL_META.info;
            const statusKey = (item.status as 'active' | 'expired') || 'active';
            const statusMeta = ANNOUNCEMENT_STATUS_META[statusKey];
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="border border-gray-100 rounded-lg overflow-hidden hover:border-primary/30 transition"
              >
                {/* 헤더 - 항상 표시 */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full px-5 py-4 flex items-start gap-3 hover:bg-gray-50 transition text-left"
                >
                  {/* 배지 */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black ${levelMeta.badge}`}>
                      {levelMeta.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black ${statusMeta.badge}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* 제목과 확장 버튼 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-black text-gray-900">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatAnnouncementPeriod(item.startDate, item.endDate)}
                    </p>
                  </div>

                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 mt-1 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* 내용 - 펼쳤을 때만 표시 */}
                {isExpanded && (
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
                      {item.content}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>
                        작성 {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                      {!item.isViewed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleMarkAsRead(item.id);
                          }}
                          disabled={markingAsRead === item.id}
                          className="px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                        >
                          {markingAsRead === item.id ? '처리 중...' : '✓ 확인했음'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {announcements.length > 0 && totalPages > 1 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-200 rounded text-sm font-semibold text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              이전
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                const pageNum = currentPage > 3 ? currentPage - 2 + idx : idx + 1;
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-semibold rounded transition ${
                      currentPage === pageNum
                        ? 'bg-primary text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-200 rounded text-sm font-semibold text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              다음
            </button>
          </div>

          <div className="text-center text-xs text-gray-400">
            페이지 {currentPage} / {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}
