'use client';

import Link from 'next/link';
import { ADMIN_DASHBOARD_CARDS } from '@/lib/admin-navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * /admin 페이지 - 관리자 대시보드
 *
 * 관리자 권한 체크는 admin 레이아웃에서 처리하므로
 * 이 페이지는 현재 로그인한 관리자의 정보를 표시하는 역할만 담당합니다.
 */
export default function AdminPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
          <p className="text-gray-600">KATC 유사호출부호 경고시스템 관리</p>
        </div>

        {/* 관리 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ADMIN_DASHBOARD_CARDS.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
            >
              <div className="text-3xl mb-3">{card.emoji}</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h2>
              <p className="text-gray-600 text-sm mb-4">{card.description}</p>
              <span className="text-blue-600 hover:text-blue-700 font-semibold">관리하기 →</span>
            </Link>
          ))}
        </div>

        {/* 빠른 통계 */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">시스템 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-gray-600 text-sm mb-1">로그인한 관리자</p>
              <p className="text-2xl font-bold text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">소속 항공사</p>
              <p className="text-2xl font-bold text-gray-900">{user?.airline?.code}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">시스템 상태</p>
              <p className="text-2xl font-bold text-green-600">정상</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
