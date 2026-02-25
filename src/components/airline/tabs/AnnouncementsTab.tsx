'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  AnnouncementSummaryCard,
  ANNOUNCEMENT_LEVEL_META,
  ANNOUNCEMENT_STATUS_META,
} from '@/types/airline';
import { formatAnnouncementPeriod, truncateText } from '@/hooks/useDateRangeFilter';
import { Announcement } from '@/types/announcement';

// 공지사항 히스토리는 status 필드가 포함됨
type AnnouncementWithStatus = Announcement & { status?: 'active' | 'expired' };

interface AnnouncementsTabProps {
  activeAnnouncements: Announcement[];
  latestAnnouncements: AnnouncementWithStatus[];
  activeAnnouncementsLoading: boolean;
  announcementHistoryLoading: boolean;
  totalActiveAnnouncements: number;
}

export function AnnouncementsTab({
  activeAnnouncements,
  latestAnnouncements,
  activeAnnouncementsLoading,
  announcementHistoryLoading,
  totalActiveAnnouncements,
}: AnnouncementsTabProps) {
  const router = useRouter();

  const warningActiveCount = activeAnnouncements.filter(
    (item) => item.level === 'warning'
  ).length;

  const completedAnnouncementsCount = latestAnnouncements.filter(
    (item) => item.status === 'expired'
  ).length;

  const summaryCards: AnnouncementSummaryCard[] = [
    {
      id: 'active-total',
      icon: '📢',
      title: '공지사항',
      value: totalActiveAnnouncements,
      description: '활성 공지사항',
      loading: activeAnnouncementsLoading,
    },
    {
      id: 'active-warning',
      icon: '🚨',
      title: '긴급공지',
      value: warningActiveCount,
      description: '경고 레벨',
      loading: activeAnnouncementsLoading,
    },
    {
      id: 'completed',
      icon: '✅',
      title: '완료',
      value: completedAnnouncementsCount,
      description: '최근 종료된 공지',
      loading: announcementHistoryLoading,
    },
  ];

  const getGradientClass = (cardId: string): string => {
    switch (cardId) {
      case 'active-total':
        return 'from-blue-50 to-blue-100 border-blue-200';
      case 'active-warning':
        return 'from-amber-50 to-amber-100 border-amber-200';
      default:
        return 'from-green-50 to-green-100 border-green-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 공지사항 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.id}
            className={`bg-gradient-to-br rounded-none p-6 border shadow-sm ${getGradientClass(
              card.id
            )}`}
          >
            <div className="text-3xl mb-2">{card.icon}</div>
            <p className="text-xs font-black uppercase tracking-widest mb-1 text-gray-600">
              {card.title}
            </p>
            <p className="text-2xl font-black text-gray-900">
              {card.loading ? '-' : `${card.value}건`}
            </p>
            <p className="text-xs text-gray-600 mt-2">{card.description}</p>
          </div>
        ))}
      </div>

      {/* 공지사항 이력 */}
      <div className="bg-white rounded-none shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-gray-900 mb-1 tracking-tight">
              공지사항 이력
            </h3>
            <p className="text-sm text-gray-500">
              최근 등록된 공지 {latestAnnouncements.length}건
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/airline/announcements')}
            className="px-4 py-2 border border-gray-200 rounded-none text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
          >
            전체 보기
          </button>
        </div>

        {announcementHistoryLoading ? (
          <div className="py-12 text-center text-gray-400 font-semibold">
            공지사항을 불러오는 중입니다...
          </div>
        ) : latestAnnouncements.length === 0 ? (
          <div className="py-12 text-center text-gray-400 font-semibold">
            표시할 공지사항이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {latestAnnouncements.map((item) => {
              const levelMeta =
                ANNOUNCEMENT_LEVEL_META[
                  item.level as keyof typeof ANNOUNCEMENT_LEVEL_META
                ] || ANNOUNCEMENT_LEVEL_META.info;
              const statusKey = (item.status as 'active' | 'expired') || 'active';
              const statusMeta = ANNOUNCEMENT_STATUS_META[statusKey];

              return (
                <div
                  key={item.id}
                  className="border border-gray-100 rounded-lg p-5 hover:border-primary/30 transition"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                    <span className={`px-2 py-1 rounded-full ${levelMeta.badge}`}>
                      {levelMeta.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full ${statusMeta.badge}`}>
                      {statusMeta.label}
                    </span>
                    <span className="text-gray-400 ml-auto">
                      {formatAnnouncementPeriod(item.startDate, item.endDate)}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-gray-900 mt-3">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {truncateText(item.content, 140)}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-400 mt-4">
                    <span>
                      작성{' '}
                      {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push('/airline/announcements')}
                      className="text-rose-600 font-semibold hover:underline"
                    >
                      상세보기
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
