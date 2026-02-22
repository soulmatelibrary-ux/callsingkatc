'use client';

import { OverviewTab } from './OverviewTab';
import { ActionsTab } from './ActionsTab';
import { StatisticsTab } from './StatisticsTab';

interface TabsProps {
  activeTab: 'overview' | 'actions' | 'stats';
  setActiveTab: (tab: 'overview' | 'actions' | 'stats') => void;
}

export function Tabs({ activeTab, setActiveTab }: TabsProps) {
  const tabs = [
    { id: 'overview' as const, label: '전체현황' },
    { id: 'actions' as const, label: '항공사조치' },
    { id: 'stats' as const, label: '통계' },
  ];

  return (
    <div className="bg-white rounded-none shadow-sm border border-gray-100">
      {/* 탭 헤더 */}
      <div className="flex border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-6 py-4 font-bold text-center border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="p-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'actions' && <ActionsTab />}
        {activeTab === 'stats' && <StatisticsTab />}
      </div>
    </div>
  );
}
