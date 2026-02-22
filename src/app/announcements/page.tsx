'use client';

import { useAuthStore } from '@/store/authStore';
import { redirect } from 'next/navigation';
import { AnnouncementTable } from '@/components/announcements/AnnouncementTable';

/**
 * /announcements - 사용자 공지사항 이력 페이지
 *
 * 기능:
 * - 자신의 항공사 공지사항 이력 조회
 * - 필터: 긴급도, 상태, 기간
 * - 페이지네이션
 * - 읽음 여부 표시
 */
export default function AnnouncementsPage() {
  const { user, accessToken } = useAuthStore();

  // 미인증 사용자 리다이렉트
  if (!accessToken || !user) {
    redirect('/');
  }

  // 관리자는 /admin/announcements로 리다이렉트
  if (user.role === 'admin') {
    redirect('/admin/announcements');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="w-full px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">공지사항</h1>
          <p className="text-gray-600 mt-2">
            모든 공지사항을 확인하세요.
          </p>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="w-full px-4 py-8">
        <AnnouncementTable isAdmin={false} />
      </div>
    </div>
  );
}
