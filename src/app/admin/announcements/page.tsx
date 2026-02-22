'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { redirect } from 'next/navigation';
import { AnnouncementTable } from '@/components/announcements/AnnouncementTable';
import { AnnouncementForm } from '@/components/announcements/AnnouncementForm';

/**
 * /admin/announcements - 관리자 공지사항 관리 페이지
 *
 * 기능:
 * - 공지사항 생성/수정/삭제
 * - 전체 공지사항 조회
 * - 필터: 긴급도, 상태, 기간
 * - 읽음 통계 (viewCount)
 */
export default function AdminAnnouncementsPage() {
  const { user, accessToken } = useAuthStore();
  const [showForm, setShowForm] = useState(false);

  // 미인증 사용자 리다이렉트
  if (!accessToken || !user) {
    redirect('/');
  }

  // 관리자 아닌 사용자 리다이렉트
  if (user.role !== 'admin') {
    redirect('/announcements');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="w-full px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">공지사항 관리</h1>
              <p className="text-gray-600 mt-2">
                모든 항공사의 공지사항을 관리하세요.
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition"
            >
              {showForm ? '닫기' : '+ 공지사항 작성'}
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="w-full px-4 py-6 space-y-8">
        {/* 폼 */}
        {showForm && (
          <AnnouncementForm
            onSuccess={() => {
              setShowForm(false);
            }}
          />
        )}

        {/* 테이블 */}
        <AnnouncementTable isAdmin={true} />
      </div>
    </div>
  );
}
