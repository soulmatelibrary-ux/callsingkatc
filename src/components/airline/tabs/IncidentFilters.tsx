'use client';

import React from 'react';
import { DateRangeType } from '@/types/airline';

type ActionStatusFilter = 'all' | 'no_action' | 'in_progress' | 'completed';
type SortOrder = 'risk' | 'count' | 'latest';

interface IncidentFiltersProps {
  startDate: string;
  endDate: string;
  activeRange: DateRangeType;
  isExporting: boolean;
  incidentsLimit: number;
  incidentsSearchInput: string;
  allFilteredIncidentsCount: number;
  actionStatusFilter?: ActionStatusFilter;
  sortOrder?: SortOrder;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  onLimitChange: (limit: number) => void;
  onStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApplyQuickRange: (type: 'today' | '1w' | '2w' | '1m') => void;
  onExport: () => void;
  onSortOrderChange?: (order: SortOrder) => void;
  onActionStatusFilterChange?: (filter: ActionStatusFilter) => void;
}

export function IncidentFilters({
  startDate,
  endDate,
  activeRange,
  isExporting,
  incidentsLimit,
  incidentsSearchInput,
  allFilteredIncidentsCount,
  actionStatusFilter,
  sortOrder,
  onSearchInputChange,
  onSearchSubmit,
  onLimitChange,
  onStartDateChange,
  onEndDateChange,
  onApplyQuickRange,
  onExport,
  onSortOrderChange,
  onActionStatusFilterChange,
}: IncidentFiltersProps) {
  const showSort = Boolean(sortOrder && onSortOrderChange);
  const showStatusFilter = Boolean(actionStatusFilter && onActionStatusFilterChange);

  return (
    <div className="w-full rounded-none border border-gray-200 bg-white px-5 py-4 shadow-sm space-y-3">
      <div className="flex w-full flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 rounded-none border border-gray-200 bg-white px-3 py-2 shadow-sm">
          <input
            type="date"
            value={startDate}
            onChange={onStartDateChange}
            className="w-[120px] border-none bg-transparent p-0 text-sm font-semibold text-gray-900 outline-none focus:ring-0"
          />
          <span className="text-sm font-bold text-gray-300">~</span>
          <input
            type="date"
            value={endDate}
            onChange={onEndDateChange}
            className="w-[120px] border-none bg-transparent p-0 text-sm font-semibold text-gray-900 outline-none focus:ring-0"
          />
        </div>

        <div className="flex h-10 overflow-hidden rounded-none border border-gray-200 shadow-sm">
          {(['today', '1w', '2w', '1m'] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => onApplyQuickRange(range)}
              className={`px-4 text-[13px] font-black tracking-tight transition-colors ${
                activeRange === range
                  ? 'bg-[#0f1b40] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              } ${range !== '1m' ? 'border-r border-gray-200' : ''}`}
            >
              {range === 'today' ? '오늘' : range === '1w' ? '1주' : range === '2w' ? '2주' : '1개월'}
            </button>
          ))}
        </div>

        <button
          onClick={onSearchSubmit}
          className="h-10 rounded-none bg-[#0f1b40] px-6 text-[13px] font-black uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-[#0b142f]"
        >
          조회
        </button>

        {showSort && (
          <div className="flex h-10 items-center gap-2 rounded-none border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">정렬</span>
            <select
              value={sortOrder}
              onChange={(e) => onSortOrderChange?.(e.target.value as SortOrder)}
              className="w-full border-none bg-transparent text-sm font-semibold text-gray-800 outline-none"
            >
              <option value="latest">최신순</option>
              <option value="count">발생건수순</option>
              <option value="risk">오류가능성순</option>
            </select>
          </div>
        )}

        <div className="flex h-10 items-center gap-2 rounded-none border border-gray-200 bg-white px-3 py-2 shadow-sm">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">LIMIT</span>
          <select
            value={incidentsLimit}
            onChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
            className="border-none bg-transparent text-sm font-semibold text-gray-800 outline-none"
          >
            <option value="10">10건</option>
            <option value="30">30건</option>
            <option value="50">50건</option>
            <option value="100">100건</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onExport}
          disabled={isExporting || allFilteredIncidentsCount === 0}
          className={`ml-auto flex h-10 items-center gap-2 rounded-none border px-5 text-[13px] font-bold shadow-sm transition-colors ${
            isExporting || allFilteredIncidentsCount === 0
              ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
              : 'border-green-700 bg-green-700 text-white hover:bg-green-800'
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>{isExporting ? '추출 중...' : '엑셀 다운로드'}</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 group">
          <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-gray-400 group-focus-within:text-[#0f1b40]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="항공사명 또는 편명(호출부호)을 입력하여 검색하세요"
            value={incidentsSearchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchSubmit();
            }}
            className="w-full rounded-none border border-gray-200 py-3 pl-14 pr-28 text-sm font-semibold text-gray-900 shadow-sm outline-none transition focus:border-[#0f1b40] focus:ring-2 focus:ring-[#0f1b40]/10"
          />
          <button
            onClick={onSearchSubmit}
            className="absolute right-1 top-1 bottom-1 rounded-none bg-[#0f1b40] px-8 text-xs font-black tracking-[0.4em] text-white transition hover:bg-[#0b142f]"
          >
            SEARCH
          </button>
        </div>

        {showStatusFilter && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500">상태</span>
            <div className="flex overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm">
              {[
                { label: '전체', value: 'all' as ActionStatusFilter },
                { label: '진행중', value: 'in_progress' as ActionStatusFilter },
                { label: '조치완료', value: 'completed' as ActionStatusFilter },
              ].map(({ label, value }) => {
                const isActive = actionStatusFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onActionStatusFilterChange?.(value)}
                    className={`px-4 py-2 text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-[#0f1b40] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
