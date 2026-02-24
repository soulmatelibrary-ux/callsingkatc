'use client';

import React, { useMemo } from 'react';
import {
  Incident,
  ErrorTypeStat,
  SubTypeStat,
  ErrorType,
  ERROR_TYPE_CONFIG,
} from '@/types/airline';

interface AnalysisTabProps {
  incidents: Incident[];
  errorTypeFilter: 'all' | ErrorType;
  onErrorTypeFilterChange: (filter: 'all' | ErrorType) => void;
}

const SUB_ERROR_COLORS: Record<string, string> = {
  '복창오류': '#6366f1',
  '무응답/재호출': '#4f46e5',
  '고도이탈': '#10b981',
  '비행경로이탈': '#f97316',
  '기타': '#6b7280',
  '오류 미발생': '#22c55e',
};

export function AnalysisTab({
  incidents,
  errorTypeFilter,
  onErrorTypeFilterChange,
}: AnalysisTabProps) {
  // 필터링된 incidents
  const filteredIncidents = useMemo(() => {
    return errorTypeFilter === 'all'
      ? incidents
      : incidents.filter((i) => i.errorType === errorTypeFilter);
  }, [incidents, errorTypeFilter]);

  // 전체 카운트
  const visibleIncidentCount = filteredIncidents.length;

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
          incidents.length > 0
            ? Math.round((count / incidents.length) * 100)
            : 0,
        ...config,
      };
    });
  }, [incidents]);

  // 세부 오류 통계
  const subTypeStats = useMemo<SubTypeStat[]>(() => {
    const stats: SubTypeStat[] = [
      {
        key: '복창오류',
        label: '복창오류',
        count: filteredIncidents.filter((i) => i.subError === '복창오류').length,
        color: SUB_ERROR_COLORS['복창오류'],
      },
      {
        key: '무응답/재호출',
        label: '무응답/재호출',
        count: filteredIncidents.filter((i) => i.subError === '무응답/재호출').length,
        color: SUB_ERROR_COLORS['무응답/재호출'],
      },
      {
        key: '고도이탈',
        label: '고도이탈',
        count: filteredIncidents.filter((i) => i.subError === '고도이탈').length,
        color: SUB_ERROR_COLORS['고도이탈'],
      },
      {
        key: '비행경로이탈',
        label: '비행경로이탈',
        count: filteredIncidents.filter((i) => i.subError === '비행경로이탈').length,
        color: SUB_ERROR_COLORS['비행경로이탈'],
      },
      {
        key: '기타',
        label: '기타',
        count: filteredIncidents.filter(
          (i) =>
            i.subError &&
            !['복창오류', '무응답/재호출', '고도이탈', '비행경로이탈'].includes(i.subError)
        ).length,
        color: SUB_ERROR_COLORS['기타'],
      },
      {
        key: '오류 미발생',
        label: '오류 미발생',
        count: filteredIncidents.filter((i) => i.errorType === '오류 미발생').length,
        color: SUB_ERROR_COLORS['오류 미발생'],
      },
    ];
    return stats;
  }, [filteredIncidents]);

  const maxSubCount = useMemo(
    () => Math.max(...subTypeStats.map((s) => s.count), 1),
    [subTypeStats]
  );

  const selectedErrorLabel = errorTypeFilter === 'all' ? '전체' : errorTypeFilter;

  // 가장 빈번한 오류 타입 계산
  const topError = useMemo(() => {
    if (subTypeStats.length === 0) return null;
    return subTypeStats.reduce((max, curr) => (curr.count > max.count ? curr : max), subTypeStats[0]);
  }, [subTypeStats]);

  const totalErrors = useMemo(
    () => subTypeStats.reduce((sum, s) => sum + s.count, 0),
    [subTypeStats]
  );

  const topPercentage = useMemo(
    () => (totalErrors > 0 && topError ? Math.round((topError.count / totalErrors) * 100) : 0),
    [totalErrors, topError]
  );

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="bg-white rounded-none shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              세부오류분석
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              오류 유형별 상세 분석 및 인사이트
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-500">필터:</span>
            <select
              value={errorTypeFilter}
              onChange={(e) =>
                onErrorTypeFilterChange(e.target.value as 'all' | ErrorType)
              }
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-none text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-700/20"
            >
              <option value="all">전체</option>
              <option value="관제사 오류">관제사 오류</option>
              <option value="조종사 오류">조종사 오류</option>
              <option value="오류 미발생">오류 미발생</option>
            </select>
          </div>
        </div>
      </div>

      {/* 세부 오류 유형별 바 차트 */}
      <div className="bg-white rounded-none shadow-sm border border-gray-100 p-8">
        <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tight">
          세부 오류 유형별 분포
        </h3>
        <div className="space-y-4">
          {subTypeStats.map((stat) => (
            <div key={stat.key} className="flex items-center gap-4">
              <div className="w-32 text-sm font-bold text-gray-700 truncate">
                {stat.label}
              </div>
              <div className="flex-1 h-10 bg-gray-100 rounded-none overflow-hidden relative">
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${maxSubCount > 0 ? (stat.count / maxSubCount) * 100 : 0}%`,
                    backgroundColor: stat.color,
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-gray-600">
                  {stat.count}건
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 분석 인사이트 */}
      <div className="bg-white rounded-none shadow-sm border border-gray-100 p-8">
        <h3 className="text-lg font-black text-gray-900 mb-4 tracking-tight">
          분석 인사이트
        </h3>
        <div className="space-y-4">
          {subTypeStats.filter((s) => s.count > 0).length === 0 ? (
            <p className="text-gray-500">
              현재 필터 조건에 해당하는 오류 데이터가 없습니다.
            </p>
          ) : (
            <>
              {topError && (
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-none border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-none flex items-center justify-center text-2xl">
                      💡
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 mb-2">
                        주요 발견사항
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        현재{' '}
                        <span className="font-black text-blue-700">
                          {selectedErrorLabel}
                        </span>{' '}
                        필터 기준, 가장 빈번한 세부 오류 유형은{' '}
                        <span
                          className="font-black"
                          style={{ color: topError.color }}
                        >
                          {topError.label}
                        </span>
                        이며 전체의{' '}
                        <span className="font-black text-blue-700">
                          {topPercentage}%
                        </span>
                        를 차지합니다.
                        {topError.key === '복창오류' &&
                          ' 복창 절차 준수에 대한 교육 강화가 권장됩니다.'}
                        {topError.key === '무응답/재호출' &&
                          ' 통신 품질 및 주파수 관리 점검이 필요합니다.'}
                        {topError.key === '고도이탈' &&
                          ' 고도 유지 절차에 대한 추가 교육이 권장됩니다.'}
                        {topError.key === '비행경로이탈' &&
                          ' 항로 이탈 방지를 위한 모니터링 강화가 필요합니다.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 오류 유형별 요약 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {errorTypeStats.map((stat) => (
                  <div
                    key={stat.type}
                    className={`p-6 rounded-none border ${stat.bgColor} border-opacity-50`}
                  >
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      {stat.label}
                    </p>
                    <p className={`text-3xl font-black ${stat.textColor}`}>
                      {stat.count}건
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {stat.description}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
