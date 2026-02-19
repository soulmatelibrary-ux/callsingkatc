/**
 * 대시보드 페이지
 * - 인증된 사용자의 메인 화면
 * - airline.html의 핵심 기능을 Next.js 컴포넌트로 전환하는 진입점
 */

'use client';

import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin());

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-label="로딩 중" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 환영 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-1 text-sm text-gray-500">
            항공사 유사호출부호 경고시스템에 오신 것을 환영합니다.
          </p>
        </div>
        <StatusBadge status={user.status} />
      </div>

      {/* 사용자 정보 카드 */}
      <Card>
        <CardHeader title="계정 정보" />
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                이메일
              </dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                역할
              </dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                {user.role === 'admin' ? '관리자' : '일반 사용자'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                계정 상태
              </dt>
              <dd className="mt-1">
                <StatusBadge status={user.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                최종 로그인
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.last_login_at
                  ? new Date(user.last_login_at).toLocaleString('ko-KR')
                  : '-'}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      {/* 빠른 링크 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href={ROUTES.CHANGE_PASSWORD}
          className="group block bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-primary hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
              비밀번호 변경
            </h3>
          </div>
          <p className="text-xs text-gray-500">계정 보안을 위해 주기적으로 변경하세요.</p>
        </Link>

        {isAdmin && (
          <Link
            href={ROUTES.ADMIN_USERS}
            className="group block bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-primary hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-navy/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                사용자 관리
              </h3>
            </div>
            <p className="text-xs text-gray-500">가입 신청 승인 및 계정 관리.</p>
          </Link>
        )}
      </div>

      {/* 향후 기능 안내 */}
      <Card>
        <CardBody className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-700">유사호출부호 발생현황</h3>
          <p className="mt-1 text-sm text-gray-500">
            항공사 데이터가 연동되면 이 영역에 현황이 표시됩니다.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
