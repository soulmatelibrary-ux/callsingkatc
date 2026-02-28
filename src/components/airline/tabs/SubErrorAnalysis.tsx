'use client';

import React, { useMemo } from 'react';
import { Incident, SubTypeStat, ErrorType } from '@/types/airline';

interface SubErrorAnalysisProps {
  incidents: Incident[];
  errorTypeFilter: 'all' | ErrorType;
  showAnalysis: boolean;
  onToggleAnalysis: (show: boolean) => void;
}

const SUB_ERROR_COLORS: Record<string, string> = {
  '복창오류': '#6366f1',
  '무응답/재호출': '#4f46e5',
  '고도이탈': '#10b981',
  '비행경로이탈': '#f97316',
  '기타': '#6b7280',
  '오류 미발생': '#22c55e',
};

export function SubErrorAnalysis({
  incidents,
  errorTypeFilter,
  showAnalysis,
  onToggleAnalysis,
}: SubErrorAnalysisProps) {
  // 필터링된 incidents
  const filteredIncidents = useMemo(() => {
    return errorTypeFilter === 'all'
      ? incidents
      : incidents.filter((i) => i.errorType === errorTypeFilter);
  }, [incidents, errorTypeFilter]);

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
        count: filteredIncidents.filter((i) => !i.subError).length,
        color: SUB_ERROR_COLORS['오류 미발생'],
      },
    ];
    return stats;
  }, [filteredIncidents]);

  const maxSubCount = useMemo(
    () => Math.max(...subTypeStats.map((s) => s.count), 1),
    [subTypeStats]
  );

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

  const selectedErrorLabel = errorTypeFilter === 'all' ? '전체' : errorTypeFilter;

  if (incidents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-none shadow-sm border border-gray-100 overflow-hidden">
      {/* 토글 헤더 */}
      <button
        type="button"
        onClick={() => onToggleAnalysis(!showAnalysis)}
        className="w-full px-8 py-4 flex items-center justify-between text-sm font-black text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <div className="flex items-center gap-3">
          <span>📊</span>
          <span>세부 오류 유형별 분포</span>
        </div>
        <span className="text-xs text-gray-400">
          {showAnalysis ? '접기' : '펼치기'}
        </span>
      </button>

      {/* 펼쳐진 내용 */}
      {showAnalysis && (
        <div className="px-8 py-6 space-y-6">
          {/* 바 차트 */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-gray-600">오류 분포</h4>
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

          {/* 분석 인사이트 */}
          {subTypeStats.filter((s) => s.count > 0).length > 0 && topError && (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-none border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-none flex items-center justify-center text-2xl flex-shrink-0">
                  💡
                </div>
                <div>
                  <h4 className="font-black text-gray-900 mb-2">주요 발견사항</h4>
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
        </div>
      )}
    </div>
  );
}
