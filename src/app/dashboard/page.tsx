/**
 * 사용자 대시보드 페이지
 * GET /dashboard
 *
 * 사용자(user) 전용 페이지
 * - 프로필 정보 표시
 * - 할당된 항공사 정보
 * - 빠른 액션
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/lib/constants';

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuthStore((s) => ({
    user: s.user,
    isAdmin: s.isAdmin(),
  }));

  // 관리자는 /admin으로 리다이렉트
  useEffect(() => {
    if (isAdmin) {
      router.push(ROUTES.ADMIN);
    }
  }, [isAdmin, router]);

  if (isAdmin) {
    return null; // 리다이렉트 중
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-24 pb-10 space-y-6">
        {/* 페이지 제목 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-1 text-sm text-gray-500">
            KATC 유사호출부호 경고시스템에 접속하셨습니다.
          </p>
        </div>

        {/* 사용자 프로필 */}
        {user && (
          <>
            <section aria-label="사용자 정보">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="이메일"
                  value={user.email}
                  color="text-primary"
                />
                {user.airline && (
                  <>
                    <StatCard
                      label="항공사 코드"
                      value={user.airline.code}
                      color="text-blue-700"
                    />
                    <StatCard
                      label="항공사명"
                      value={user.airline.name_ko}
                      color="text-blue-700"
                    />
                  </>
                )}
              </div>
            </section>

            {/* 계정 상태 */}
            <Card>
              <CardHeader
                title="계정 상태"
                description="귀하의 계정 정보"
              />
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">상태</span>
                    <StatusBadge status={user.status} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">역할</span>
                    <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold">
                      {user.role === 'admin' ? '관리자' : '사용자'}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 빠른 액션 */}
            <Card>
              <CardHeader
                title="빠른 액션"
                description="자주 사용하는 기능"
              />
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {!user.airline && (
                    <Link
                      href="/(main)/airline"
                      className="px-4 py-3 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors text-center"
                    >
                      항공사 선택
                    </Link>
                  )}
                  <Link
                    href={ROUTES.CHANGE_PASSWORD}
                    className="px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors text-center"
                  >
                    비밀번호 변경
                  </Link>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
