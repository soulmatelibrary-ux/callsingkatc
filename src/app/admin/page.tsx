/**
 * 관리자 대시보드 메인 페이지
 * GET /admin
 *
 * 표시 항목:
 * - 사용자 통계 (전체 / 활성 / 정지)
 * - 최근 로그인 목록
 * - 시스템 상태
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiFetch } from '@/lib/api/client';

interface UserStats {
  total: number;
  active: number;
  suspended: number;
}

interface RecentLogin {
  id: string;
  email: string;
  status: 'active' | 'suspended';
  role: string;
  lastLoginAt: string;
}

interface SystemStatus {
  db: 'ok' | 'error';
  api: 'ok' | 'error';
}

interface DashboardData {
  users: UserStats;
  recentLogins: RecentLogin[];
  systemStatus: SystemStatus;
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function SystemStatusIndicator({ status }: { status: 'ok' | 'error' }) {
  const isOk = status === 'ok';
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${
          isOk ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span
        className={`text-sm font-semibold ${
          isOk ? 'text-green-700' : 'text-red-700'
        }`}
      >
        {isOk ? '정상' : '오류'}
      </span>
    </span>
  );
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        setIsLoading(true);
        const response = await apiFetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('통계 데이터를 불러오지 못했습니다.');
        }
        const result: DashboardData = await response.json();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 페이지 제목 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            <p className="mt-1 text-sm text-gray-500">
              KATC 유사호출부호 경고시스템 현황
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/users"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              사용자 관리
            </Link>
            <Link
              href="/admin/password-reset"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              비밀번호 초기화
            </Link>
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* 로딩 */}
        {isLoading && (
          <div className="py-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm text-gray-500">대시보드 데이터 로딩 중...</p>
          </div>
        )}

        {/* 통계 카드 */}
        {data && (
          <>
            <section aria-label="사용자 통계">
              <h2 className="sr-only">사용자 통계</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="전체 사용자"
                  value={data.users.total}
                  color="text-gray-900"
                />
                <StatCard
                  label="활성 사용자"
                  value={data.users.active}
                  color="text-green-700"
                />
                <StatCard
                  label="정지 사용자"
                  value={data.users.suspended}
                  color="text-red-700"
                />
              </div>
            </section>

            {/* 최근 로그인 */}
            <Card>
              <CardHeader
                title="최근 로그인"
                description="최근 로그인한 사용자 5명"
              />
              <CardBody className="p-0">
                {data.recentLogins.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-gray-500">
                    최근 로그인 기록이 없습니다.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                            이메일
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                            상태
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                            역할
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                            최근 로그인
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.recentLogins.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-3 font-medium text-gray-900">
                              {user.email}
                            </td>
                            <td className="px-6 py-3">
                              <StatusBadge status={user.status} />
                            </td>
                            <td className="px-6 py-3 text-gray-600">
                              {user.role === 'admin' ? '관리자' : '사용자'}
                            </td>
                            <td className="px-6 py-3 text-gray-500">
                              {formatDate(user.lastLoginAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* 시스템 상태 */}
            <Card>
              <CardHeader
                title="시스템 상태"
                description="주요 서비스 상태 확인"
              />
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">데이터베이스</span>
                    <SystemStatusIndicator status={data.systemStatus.db} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">API 서버</span>
                    <SystemStatusIndicator status={data.systemStatus.api} />
                  </div>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
