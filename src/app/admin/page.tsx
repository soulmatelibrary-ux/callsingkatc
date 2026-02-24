'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

/**
 * /admin 페이지 - 관리자 대시보드
 */
export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // 권한 확인 - 관리자가 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace(ROUTES.HOME);
    }
  }, [user, router]);

  // 관리자가 아니면 아무것도 렌더링하지 않음
  if (!user || user.role !== 'admin') {
    return null;
  }

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
          {/* 유사호출부호 관리 */}
          <Link
            href={ROUTES.ADMIN_CALLSIGN_MANAGEMENT}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
          >
            <div className="text-3xl mb-3">📞</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">유사호출부호 관리</h2>
            <p className="text-gray-600 text-sm mb-4">호출부호 쌍 등록 및 수정, 엑셀 업로드</p>
            <span className="text-blue-600 hover:text-blue-700 font-semibold">관리하기 →</span>
          </Link>

          {/* 사용자 관리 */}
          <Link
            href={ROUTES.ADMIN_USERS}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
          >
            <div className="text-3xl mb-3">👥</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">사용자 관리</h2>
            <p className="text-gray-600 text-sm mb-4">사용자 계정 승인, 비밀번호 재설정</p>
            <span className="text-blue-600 hover:text-blue-700 font-semibold">관리하기 →</span>
          </Link>

          {/* 항공사 관리 */}
          <Link
            href={ROUTES.ADMIN_AIRLINES}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
          >
            <div className="text-3xl mb-3">✈️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">항공사 관리</h2>
            <p className="text-gray-600 text-sm mb-4">항공사 정보 추가, 수정, 삭제</p>
            <span className="text-blue-600 hover:text-blue-700 font-semibold">관리하기 →</span>
          </Link>

          {/* 조치 관리 */}
          <Link
            href={ROUTES.ADMIN_ACTIONS}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
          >
            <div className="text-3xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">조치 관리</h2>
            <p className="text-gray-600 text-sm mb-4">조치 이력 추적 및 상태 관리</p>
            <span className="text-blue-600 hover:text-blue-700 font-semibold">관리하기 →</span>
          </Link>

          {/* 공지사항 관리 */}
          <Link
            href={ROUTES.ADMIN_ANNOUNCEMENTS}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
          >
            <div className="text-3xl mb-3">📢</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">공지사항 관리</h2>
            <p className="text-gray-600 text-sm mb-4">공지사항 등록 및 배포</p>
            <span className="text-blue-600 hover:text-blue-700 font-semibold">관리하기 →</span>
          </Link>

          {/* 파일 업로드 */}
          <Link
            href={ROUTES.ADMIN_FILE_UPLOADS}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
          >
            <div className="text-3xl mb-3">📁</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">파일 업로드</h2>
            <p className="text-gray-600 text-sm mb-4">Excel 파일 업로드 이력 조회</p>
            <span className="text-blue-600 hover:text-blue-700 font-semibold">조회하기 →</span>
          </Link>
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
