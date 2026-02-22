'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { OverviewTab } from '@/components/callsign-management/OverviewTab';
import { ActionsTab } from '@/components/callsign-management/ActionsTab';
import { StatisticsTab } from '@/components/callsign-management/StatisticsTab';
import { Sidebar } from '@/components/callsign-management/Sidebar';
import { Header } from '@/components/layout/Header';
import { NanoIcon } from '@/components/ui/NanoIcon';
import {
  BarChart3,
  Plane,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function CallsignManagementPublicPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const menuItems = [
    { id: 'overview', label: '전체현황', icon: BarChart3, color: 'primary' },
    { id: 'actions', label: '항공사조치', icon: Plane, color: 'info' },
    { id: 'stats', label: '통계', icon: TrendingUp, color: 'success' },
    { id: 'upload', label: '엑셀입력', icon: FileSpreadsheet, color: 'orange' },
  ];

  const handleTabChange = (tabId: string) => {
    router.push(`/callsign-management?tab=${tabId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* 왼쪽 메뉴 */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col pt-0 shrink-0 h-screen overflow-y-auto sticky top-0">
          <div className="px-6 py-4 mb-0">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">
              유사호출부호 관리
            </h2>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full group flex items-center gap-4 px-4 py-4 rounded-none text-sm font-bold tracking-tight transition-all text-left border-l-4 ${isActive
                    ? 'bg-navy text-white shadow-[0_10px_20px_rgba(30,58,95,0.2)] border-primary'
                    : 'text-gray-500 hover:bg-gray-50 border-transparent hover:border-gray-200'
                    }`}
                >
                  <NanoIcon
                    icon={item.icon as any}
                    color={item.color as any}
                    size="sm"
                    isActive={isActive}
                  />
                  <span className={`transition-all duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto">
          <main className="flex-1 w-full px-6 pt-6 pb-10">
            {/* 페이지 헤더 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-1 bg-primary rounded-full" />
                  <span className="text-primary font-bold text-sm tracking-widest uppercase">
                    System Management
                  </span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">유사호출부호 관리</h1>
                <p className="mt-2 text-gray-500 font-medium">
                  항공교통본부 관리자 통합 대시보드 - 유사호출부호 업로드 및 항공사 조치 현황
                </p>
              </div>
            </div>

            {/* 콘텐츠 표시 */}
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'actions' && <ActionsTab />}
            {activeTab === 'stats' && <StatisticsTab />}
            {activeTab === 'upload' && <Sidebar />}
          </main>
        </div>
      </div>
    </div>
  );
}
