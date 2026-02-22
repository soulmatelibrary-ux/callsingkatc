'use client';

import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { NanoIcon } from '@/components/ui/NanoIcon';
import {
  BarChart3,
  Plane,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export default function CallsignMgmtV1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const menuItems = [
    { id: 'overview', label: '전체현황', href: ROUTES.CALLSIGN_MGT_V1, icon: BarChart3, color: 'primary' },
    { id: 'actions', label: '항공사조치', href: `${ROUTES.CALLSIGN_MGT_V1}?tab=actions`, icon: Plane, color: 'info' },
    { id: 'stats', label: '통계', href: `${ROUTES.CALLSIGN_MGT_V1}?tab=stats`, icon: TrendingUp, color: 'success' },
    { id: 'upload', label: '엑셀입력', href: `${ROUTES.CALLSIGN_MGT_V1}?tab=upload`, icon: FileSpreadsheet, color: 'orange' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* V1 전용 사이드바 (AdminSidebar 디자인 통일) */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col pt-0 shrink-0 h-[calc(100vh-64px)] overflow-y-auto sticky top-[64px]">
          <div className="px-6 py-8 mb-2">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">
              V1 MANAGEMENT
            </h2>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
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
                </Link>
              );
            })}
          </nav>

          <div className="p-6 mt-auto border-t border-gray-100">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-none text-xs text-gray-500 font-medium">
              유사호출부호 관리 V1 시스템입니다. 데이터 정합성을 위해 가이드라인을 준수해 주세요.
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
