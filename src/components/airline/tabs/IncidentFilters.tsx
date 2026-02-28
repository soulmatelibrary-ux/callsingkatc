'use client';

import React from 'react';
import { DateRangeType } from '@/types/airline';

interface IncidentFiltersProps {
  startDate: string;
  endDate: string;
  activeRange: DateRangeType;
  isExporting: boolean;
  incidentsLimit: number;
  incidentsSearchInput: string;
  allFilteredIncidentsCount: number;

  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  onLimitChange: (limit: number) => void;
  onStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApplyQuickRange: (type: 'today' | '1w' | '2w' | '1m') => void;
  onExport: () => void;
}

export function IncidentFilters({
  startDate,
  endDate,
  activeRange,
  isExporting,
  incidentsLimit,
  incidentsSearchInput,
  allFilteredIncidentsCount,
  onSearchInputChange,
  onSearchSubmit,
  onLimitChange,
  onStartDateChange,
  onEndDateChange,
  onApplyQuickRange,
  onExport,
}: IncidentFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-3">
      {/* 검색 바 (flex-1) */}
      <div className="flex-1 relative group w-full md:w-auto">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="호출부호 쌍을 검색하세요"
          value={incidentsSearchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearchSubmit(); }}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-none text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-700/20 focus:border-rose-700 transition-all placeholder:text-gray-300"
        />
        <button
          onClick={onSearchSubmit}
          className="absolute right-2 top-1.5 bottom-1.5 px-5 bg-[#00205b] text-white text-[11px] font-black rounded-none shadow-none hover:bg-[#001540] transition-all uppercase tracking-widest"
        >
          Search
        </button>
      </div>

      {/* Limit 선택 */}
      <div className="bg-white/50 backdrop-blur-sm rounded-none px-3 py-2 shadow-sm border border-gray-100 flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
          Limit
        </span>
        <select
          value={incidentsLimit}
          onChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
          className="bg-transparent text-sm font-black text-gray-700 focus:outline-none cursor-pointer"
        >
          <option value="10">10</option>
          <option value="30">30</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      {/* 날짜 범위 */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-none px-3 py-2 flex items-center gap-2 flex-shrink-0">
        <input
          type="date"
          value={startDate}
          onChange={onStartDateChange}
          className="bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer"
        />
        <span className="text-gray-300 font-bold">~</span>
        <input
          type="date"
          value={endDate}
          onChange={onEndDateChange}
          className="bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer"
        />
      </div>

      {/* Quick Range 버튼 */}
      <div className="flex rounded-none border border-gray-200 overflow-hidden flex-shrink-0">
        {(['search', 'today', '1w', '2w', '1m'] as const).map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => {
              if (range === 'search') {
                onSearchSubmit();
              } else {
                onApplyQuickRange(range as 'today' | '1w' | '2w' | '1m');
              }
            }}
            className={`px-3 py-2 text-xs font-black tracking-tight transition-all border-r border-gray-200 last:border-r-0 ${
              range === 'search'
                ? 'bg-white text-gray-500 hover:bg-gray-900 hover:text-white'
                : activeRange === range
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-900 hover:text-white'
            }`}
          >
            {range === 'search' ? '검색' : range === 'today' ? '오늘' : range === '1w' ? '1주' : range === '2w' ? '2주' : '1개월'}
          </button>
        ))}
      </div>

      {/* Excel 내보내기 */}
      <button
        type="button"
        onClick={onExport}
        disabled={isExporting || allFilteredIncidentsCount === 0}
        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-none font-bold shadow-sm transition-all text-sm border ${
          isExporting || allFilteredIncidentsCount === 0
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span className="whitespace-nowrap">{isExporting ? '...' : 'Excel'}</span>
      </button>
    </div>
  );
}
