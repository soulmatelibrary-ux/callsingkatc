'use client';

import { useSearchParams } from 'next/navigation';
import { OverviewTab } from '@/components/callsign-mgmt-v1/OverviewTab';
import { ActionsTab } from '@/components/callsign-mgmt-v1/ActionsTab';
import { StatisticsTab } from '@/components/callsign-mgmt-v1/StatisticsTab';
import { Sidebar } from '@/components/callsign-mgmt-v1/Sidebar';

export const dynamic = 'force-dynamic';

export default function CallsignMgmtV1PublicPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-full">
      <main className="flex-1 w-full px-10 py-12">
        <div className="flex flex-col gap-2 mb-12">
          <div className="flex items-center gap-2">
            <span className="w-8 h-1 bg-primary rounded-full" />
            <span className="text-primary font-bold text-sm tracking-widest uppercase">
              System Management
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">유사호출부호 관리 V1</h1>
          <p className="mt-2 text-gray-500 font-medium">
            항공교통본부 관리자 통합 대시보드 - 유사호출부호 업로드 및 항공사 조치 현황
          </p>
        </div>

        <div className="w-full">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'actions' && <ActionsTab />}
          {activeTab === 'stats' && <StatisticsTab />}
          {activeTab === 'upload' && <Sidebar />}
        </div>
      </main>
    </div>
  );
}
