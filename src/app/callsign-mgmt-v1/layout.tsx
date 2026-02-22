'use client';

import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function CallsignMgmtV1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const menuItems = [
    { id: 'overview', label: '전체현황', href: ROUTES.CALLSIGN_MGT_V1, icon: '📊' },
    { id: 'actions', label: '항공사조치', href: `${ROUTES.CALLSIGN_MGT_V1}?tab=actions`, icon: '✈️' },
    { id: 'stats', label: '통계', href: `${ROUTES.CALLSIGN_MGT_V1}?tab=stats`, icon: '📈' },
    { id: 'upload', label: '엑셀입력', href: `${ROUTES.CALLSIGN_MGT_V1}?tab=upload`, icon: '📁' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* V1 전용 사이드바 (AdminSidebar 디자인 통일) */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col pt-0 shrink-0 h-[calc(100vh-64px)] overflow-y-auto">
          <div className="px-6 py-6">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">
              V1 MANAGEMENT
            </h2>
          </div>
          <nav className="flex-1 px-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-none text-sm font-bold tracking-tight transition-all text-left border-l-4 ${isActive
                      ? 'bg-navy text-white shadow-md border-primary'
                      : 'text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-300'
                    }`}
                >
                  <span className="text-lg opacity-90">{item.icon}</span>
                  <span>{item.label}</span>
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
