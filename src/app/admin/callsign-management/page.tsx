'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { OverviewTab } from '@/components/callsign-management/OverviewTab';
// import { ActionsTab } from '@/components/callsign-management/ActionsTab';
import { StatisticsTab } from '@/components/callsign-management/StatisticsTab';
import { Sidebar } from '@/components/callsign-management/Sidebar';

export const dynamic = 'force-dynamic';

export default function CallsignManagementPage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore((state) => ({
    accessToken: state.accessToken,
    user: state.user,
  }));
  const isAdmin = useAuthStore((state) => state.isAdmin());
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'stats' | 'upload'>('overview');

  const menuItems = [
    { id: 'overview', label: '전체현황', icon: '📊' },
    // { id: 'actions', label: '항공사조치', icon: '✈️' },
    { id: 'stats', label: '통계', icon: '📈' },
    { id: 'upload', label: '엑셀입력', icon: '📁' },
  ];

  useEffect(() => {
    // 관리자가 아니면 항공사용 화면으로 즉시 이동
    if (!accessToken || !user) {
      router.replace('/login');
      return;
    }

    if (!isAdmin) {
      router.replace('/airline');
      return;
    }

    setIsCheckingAuth(false);
  }, [accessToken, isAdmin, router, user]);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm font-semibold text-gray-500">접근 권한을 확인하고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#f8fafc] selection:bg-primary/10 min-h-full">
      <main className="flex-1 w-full px-6 pt-8 pb-10">
        {/* 페이지 헤더 */}
        <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-8">
          <span className="w-6 h-0.5 bg-primary rounded-full" />
          <span className="text-primary font-bold text-xs tracking-widest uppercase">System Management</span>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">유사호출부호 관리</h1>
          <span className="text-xs text-gray-500">- 항공교통본부 관리자 대시보드</span>
        </div>

        {/* 메인 콘텐츠: 왼쪽 메뉴 + 오른쪽 콘텐츠 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 왼쪽 메뉴 */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-none shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="p-6 border-b border-gray-50">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">메뉴</h3>
              </div>
              <nav className="divide-y divide-gray-50">
                {menuItems.filter(item => item.id !== 'actions').map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full px-6 py-4 text-left font-bold transition-all ${
                      activeTab === item.id
                        ? 'bg-primary/10 text-primary border-l-4 border-primary'
                        : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 오른쪽 콘텐츠 */}
          <div className="md:col-span-3">
            {activeTab === 'overview' && <OverviewTab />}
            {/* {activeTab === 'actions' && <ActionsTab />} */}
            {activeTab === 'stats' && <StatisticsTab />}
            {activeTab === 'upload' && <Sidebar />}
          </div>
        </div>
      </main>
    </div>
  );
}
