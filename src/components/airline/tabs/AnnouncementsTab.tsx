'use client';

import React from 'react';
import { Announcement } from '@/types/announcement';
import { AirlineAnnouncementList } from '../AirlineAnnouncementList';

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
  return (
    <div className="space-y-6">
      {/* 공지사항 전체 */}
      <div className="bg-white rounded-none shadow-sm border border-gray-100 p-8">
        <AirlineAnnouncementList
          title="공지사항"
          subtitle="전체 공지사항을 확인하세요"
          showSearch={true}
          showLevelFilter={true}
          showStatusFilter={false}
          defaultLimit={10}
          initialStatus="all"
        />
      </div>
    </div>
  );
}
