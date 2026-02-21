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

function PremiumStatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="group relative bg-white rounded-none p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
      <div
        className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-none opacity-5 group-hover:opacity-10 transition-opacity ${color
          .replace('text-', 'bg-')
          .replace('-900', '-500')
          .replace('-700', '-500')}`}
      />

      <div className="relative flex justify-between items-start">
        <div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className={`text-4xl font-black ${color} tracking-tighter`}>
            {value.toLocaleString()}
          </p>
        </div>
        {icon && (
          <div
            className={`p-3 rounded-none ${color
              .replace('text-', 'bg-')
              .replace('-700', '-50')
              .replace('-900', '-50')} transition-colors`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1">
        <span className="text-[10px] font-bold text-gray-400">Total System Users</span>
        <div className="h-[1px] flex-1 bg-gray-100" />
      </div>
    </div>
  );
}

function SystemStatusIndicator({ status }: { status: 'ok' | 'error' }) {
  const isOk = status === 'ok';
  return (
    <span className="flex items-center gap-2">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-none ${isOk ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'
          }`}
      />
      <span
        className={`text-xs font-black uppercase tracking-widest ${isOk ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
          } px-2 py-1 rounded-none`}
      >
        {isOk ? 'Normal' : 'Error'}
      </span>
    </span>
  );
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
          setTimeout(() => setIsLoaded(true), 100);
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
    <div className="min-h-screen flex flex-col bg-gray-50 selection:bg-rose-700/10">
      <Header />
      <main className="flex min-h-screen bg-gray-50">
        <aside className="w-72 bg-white border-r border-gray-100 flex flex-col pt-4">
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-1">
              <div className="px-4 pb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                시스템 관리
              </div>

              <Link
                href="/admin"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-none text-sm font-black tracking-tight transition-all text-left bg-rose-700 text-white shadow-none"
              >
                <span className="flex-1">대시보드</span>
              </Link>
              <Link
                href="/admin/users?tab=users"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-none text-sm font-black tracking-tight transition-all text-left text-gray-500 hover:bg-gray-100"
              >
                <span className="flex-1">사용자 관리</span>
              </Link>
              <Link
                href="/admin/users?tab=airlines"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-none text-sm font-black tracking-tight transition-all text-left text-gray-500 hover:bg-gray-100"
              >
                <span className="flex-1">항공사 관리</span>
              </Link>
              <Link
                href="/admin/users?tab=password"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-none text-sm font-black tracking-tight transition-all text-left text-gray-500 hover:bg-gray-100"
              >
                <span className="flex-1">비밀번호 초기화</span>
              </Link>
            </nav>
          </div>
        </aside>

        <div className="flex-1 overflow-auto">
          <div className={`w-full px-8 py-10 space-y-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
            {/* 페이지 제목 섹션 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
                <p className="mt-2 text-gray-600 font-bold">
                  KATC 유사호출부호 경고시스템 데이터 및 서비스 현황을 확인하세요.
                </p>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="px-6 py-4 rounded-none bg-red-50 border border-red-100 text-sm text-red-700 font-bold shadow-sm flex items-center gap-3 animate-bounce"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            {isLoading && (
              <div className="py-20 text-center">
                <div className="inline-block w-8 h-8 border-4 border-rose-700 border-t-transparent rounded-none animate-spin" />
                <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
                  Data Synchronizing...
                </p>
              </div>
            )}

            {/* 통계 카드 */}
            {data && (
              <>
                <section aria-label="사용자 통계">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <PremiumStatCard
                      label="전체 사용자"
                      value={data.users.total}
                      color="text-gray-900"
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      }
                    />
                    <PremiumStatCard
                      label="활성 사용자"
                      value={data.users.active}
                      color="text-emerald-700"
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      }
                    />
                    <PremiumStatCard
                      label="정지 사용자"
                      value={data.users.suspended}
                      color="text-rose-700"
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      }
                    />
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* 최근 로그인 */}
                  <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                      <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">최근 로그인</h3>
                        <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">
                          Recent Access Logs
                        </p>
                      </div>
                    </div>

                    {data.recentLogins.length === 0 ? (
                      <div className="px-8 py-12 text-center">
                        <p className="text-sm font-bold text-gray-400 uppercase">No Recent Records</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-white">
                              <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                Email Detail
                              </th>
                              <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                Status
                              </th>
                              <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                Privilege
                              </th>
                              <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                Access Time
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {data.recentLogins.map((user) => (
                              <tr key={user.id} className="group hover:bg-primary/[0.02] transition-all">
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                      {user.email[0].toUpperCase()}
                                    </div>
                                    <span className="font-bold text-gray-700">{user.email}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-5">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${user.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                                      }`}
                                  >
                                    {user.status}
                                  </span>
                                </td>
                                <td className="px-8 py-5 font-bold text-gray-600">
                                  {user.role === 'admin' ? '관리자' : '사용자'}
                                </td>
                                <td className="px-8 py-5 text-gray-400 font-medium">
                                  {formatDate(user.lastLoginAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* 시스템 상태 */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">시스템 상태</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col gap-2 p-5 rounded-2xl bg-gray-50/50 border border-gray-100 group hover:border-emerald-200 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-gray-800">Database Engine</span>
                            <SystemStatusIndicator status={data.systemStatus.db} />
                          </div>
                          <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ${data.systemStatus.db === 'ok' ? 'bg-emerald-500 w-full' : 'bg-red-500 w-1/4'
                                }`}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 p-5 rounded-2xl bg-gray-50/50 border border-gray-100 group hover:border-emerald-200 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-gray-800">API Server</span>
                            <SystemStatusIndicator status={data.systemStatus.api} />
                          </div>
                          <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ${data.systemStatus.api === 'ok' ? 'bg-emerald-500 w-full' : 'bg-red-500 w-1/4'
                                }`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 p-6 rounded-2xl bg-navy text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                          </svg>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">
                          Maintenance
                        </p>
                        <h4 className="font-bold text-sm mb-2">실시간 서비스 활성 상태</h4>
                        <p className="text-xs text-white/70 leading-relaxed">
                          모든 백엔드 모듈이 정상적으로 응답 중이며 실시간 유사호출부호 감시가 활성화되어
                          있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
        );
}
