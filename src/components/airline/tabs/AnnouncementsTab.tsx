'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AnnouncementSummaryCard } from '@/types/airline';
import { Announcement } from '@/types/announcement';
import { AirlineAnnouncementList } from '../AirlineAnnouncementList';

// 공지사항 히스토리는 status, isViewed 필드가 포함됨
type AnnouncementWithStatus = Announcement & {
  status?: 'active' | 'expired';
  isViewed?: boolean;
};

interface AnnouncementsTabProps {
  activeAnnouncements: Announcement[];
  activeAnnouncementsLoading: boolean;
  totalActiveAnnouncements: number;
}

export function AnnouncementsTab({
  activeAnnouncements,
  activeAnnouncementsLoading,
  totalActiveAnnouncements,
}: AnnouncementsTabProps) {
  const router = useRouter();

  const warningActiveCount = activeAnnouncements.filter(
    (item) => item.level === 'warning'
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
        <AirlineAnnouncementList
          title="확인할 공지사항"
          showSearch={false}
          showLevelFilter={false}
          showStatusFilter={false}
          onViewAll={() => router.push('/airline/announcements')}
          defaultLimit={5}
          initialStatus="all"
        />
      </div>
    </div>
  );
}
