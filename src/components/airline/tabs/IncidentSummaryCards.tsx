'use client';

import React, { useMemo } from 'react';
import { Incident, ErrorTypeStat, ErrorType, ERROR_TYPE_CONFIG } from '@/types/airline';

interface IncidentSummaryCardsProps {
  incidents: Incident[];
  errorTypeFilter: 'all' | ErrorType;
  onErrorTypeFilterChange: (filter: 'all' | ErrorType) => void;
}

export function IncidentSummaryCards({
  incidents,
  errorTypeFilter,
  onErrorTypeFilterChange,
}: IncidentSummaryCardsProps) {
  const visibleIncidentCount = incidents.length;

  // 오류 유형별 통계
  const errorTypeStats = useMemo<ErrorTypeStat[]>(() => {
    const uniqueTypes = Array.from(
      new Set(incidents.map((i) => i.errorType).filter(Boolean))
    );

    return uniqueTypes.map((type) => {
      const count = incidents.filter((i) => i.errorType === type).length;
      const config =
        ERROR_TYPE_CONFIG[type as ErrorType] || {
          label: type,
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600',
          description: `${type}로 판명된 사례`,
        };
      return {
        type,
        count,
        percentage:
          visibleIncidentCount > 0
            ? Math.round((count / visibleIncidentCount) * 100)
            : 0,
        ...config,
      };
    });
  }, [incidents, visibleIncidentCount]);

  if (visibleIncidentCount === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Cases 카드 */}
      <div className="group relative bg-white rounded-none p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-none opacity-[0.03] group-hover:opacity-[0.07] transition-opacity bg-gray-900" />
        <div className="relative flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              Total Cases
            </p>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-5xl font-black text-gray-900 tracking-tighter">
              {visibleIncidentCount}
            </p>
            <span className="text-sm font-bold text-gray-400">건</span>
          </div>
          <p className="mt-1 text-[12px] font-bold text-gray-400 leading-tight">
            전체 진행 중 호출부호 누적 건수
          </p>
        </div>
      </div>

      {/* 동적으로 생성된 에러 타입별 카드 */}
      {errorTypeStats.map((stat) => (
        <div
          key={stat.type}
          onClick={() =>
            onErrorTypeFilterChange(
              errorTypeFilter === stat.type ? 'all' : (stat.type as ErrorType)
            )
          }
          className={`group relative bg-white rounded-none p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer ${
            errorTypeFilter === stat.type ? 'ring-2 ring-opacity-50' : ''
          }`}
        >
          <div
            className="absolute -right-6 -bottom-6 w-32 h-32 rounded-none opacity-[0.03] group-hover:opacity-[0.07] transition-opacity"
          />
          <div className="relative flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                {stat.label}
              </p>
              {visibleIncidentCount > 0 && (
                <span
                  className={`text-[10px] font-black px-2 py-1 rounded-none ${stat.bgColor} ${stat.textColor}`}
                >
                  {stat.percentage}%
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <p className={`text-5xl font-black tracking-tighter ${stat.textColor}`}>
                {stat.count}
              </p>
              <span className="text-sm font-bold text-gray-400">건</span>
            </div>
            <p className="mt-auto pt-4 text-[12px] font-bold text-gray-400 leading-tight">
              {stat.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
