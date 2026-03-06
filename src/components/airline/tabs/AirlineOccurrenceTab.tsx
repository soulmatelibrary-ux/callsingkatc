'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Incident, DateRangeType, RISK_LEVEL_ORDER, ErrorType } from '@/types/airline';
import { IncidentFilters } from './IncidentFilters';

interface AirlineOccurrenceTabProps {
  incidents: Incident[];
  airlineCode: string;
  startDate: string;
  endDate: string;
  activeRange: DateRangeType;
  errorTypeFilter: 'all' | ErrorType;
  isExporting: boolean;
  incidentsPage: number;
  incidentsLimit: number;
  incidentsSearchInput: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  onStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApplyQuickRange: (type: 'today' | '1w' | '2w' | '1m') => void;
  onErrorTypeFilterChange: (filter: 'all' | ErrorType) => void;
  onExport: () => void;
  onOpenActionModal: (incident: Incident) => void;
}

type SortOrder = 'risk' | 'count' | 'latest';
type ActionStatusFilter = 'all' | 'no_action' | 'in_progress' | 'completed';

export function AirlineOccurrenceTab({
  incidents,
  airlineCode,
  startDate,
  endDate,
  activeRange,
  errorTypeFilter,
  isExporting,
  incidentsPage,
  incidentsLimit,
  incidentsSearchInput,
  onPageChange,
  onLimitChange,
  onSearchInputChange,
  onSearchSubmit,
  onStartDateChange,
  onEndDateChange,
  onApplyQuickRange,
  onErrorTypeFilterChange,
  onExport,
  onOpenActionModal,
}: AirlineOccurrenceTabProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [actionStatusFilter, setActionStatusFilter] = useState<ActionStatusFilter>('all');

  // 날짜 필터링된 incidents
  const filteredByDate = useMemo(() => {
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;

    return incidents.filter((incident) => {
      if (!startDateObj || !endDateObj) return true;
      const incidentDate = new Date(incident.lastDate || '');
      if (Number.isNaN(incidentDate.getTime())) return true;
      return incidentDate >= startDateObj && incidentDate <= endDateObj;
    });
  }, [incidents, startDate, endDate]);

  // 에러 타입 + 검색어 + 정렬 적용된 최종 목록
  const allFilteredIncidents = useMemo(() => {
    let filtered =
      errorTypeFilter === 'all'
        ? filteredByDate
        : filteredByDate.filter((i) => i.errorType === errorTypeFilter);

    if (actionStatusFilter === 'completed') {
      filtered = filtered.filter((i) => i.actionStatus === 'completed');
    } else if (actionStatusFilter === 'in_progress') {
      filtered = filtered.filter((i) => i.actionStatus !== 'completed');
    } else if (actionStatusFilter === 'no_action') {
      filtered = filtered.filter((i) => !i.actionStatus || i.actionStatus === 'no_action');
    }

    if (incidentsSearchInput.trim()) {
      const q = incidentsSearchInput.trim().toLowerCase();
      filtered = filtered.filter((i) => i.pair.toLowerCase().includes(q));
    }

    return filtered.sort((a, b) => {
      if (sortOrder === 'risk') {
        const riskA = RISK_LEVEL_ORDER[a.risk as keyof typeof RISK_LEVEL_ORDER] || 0;
        const riskB = RISK_LEVEL_ORDER[b.risk as keyof typeof RISK_LEVEL_ORDER] || 0;
        if (riskA !== riskB) return riskB - riskA;
        return (b.count || 0) - (a.count || 0);
      } else if (sortOrder === 'count') {
        if ((b.count || 0) !== (a.count || 0)) return (b.count || 0) - (a.count || 0);
        return (RISK_LEVEL_ORDER[b.risk as keyof typeof RISK_LEVEL_ORDER] || 0) - (RISK_LEVEL_ORDER[a.risk as keyof typeof RISK_LEVEL_ORDER] || 0);
      } else {
        const dateA = a.lastDate ? new Date(a.lastDate).getTime() : 0;
        const dateB = b.lastDate ? new Date(b.lastDate).getTime() : 0;
        return dateB - dateA;
      }
    });
  }, [filteredByDate, errorTypeFilter, incidentsSearchInput, sortOrder, actionStatusFilter]);

  // 통계 계산
  const stats = useMemo(() => {
    const total = filteredByDate.length; // 유사호출부호 쌍 수
    
    // occurrences 기반 오류 유형별 카운트 (발생 이력 기준)
    let atc = 0;
    let pilot = 0;
    let none = 0;
    
    filteredByDate.forEach((incident) => {
      if (incident.occurrences && incident.occurrences.length > 0) {
        incident.occurrences.forEach((occ) => {
          if (occ.errorType === '관제사오류') atc++;
          else if (occ.errorType === '조종사오류') pilot++;
          else if (occ.errorType === '오류미발생') none++;
        });
      }
    });
    
    const totalOccurrences = atc + pilot + none; // 총 발생 이력 수
    
    return {
      total,
      atc,
      pilot,
      none,
      totalOccurrences,
      atcPercent: totalOccurrences > 0 ? Math.round((atc / totalOccurrences) * 100) : 0,
      pilotPercent: totalOccurrences > 0 ? Math.round((pilot / totalOccurrences) * 100) : 0,
      nonePercent: totalOccurrences > 0 ? Math.round((none / totalOccurrences) * 100) : 0,
    };
  }, [filteredByDate]);

  // 페이징
  const totalPages = Math.max(1, Math.ceil(allFilteredIncidents.length / incidentsLimit));
  const pagedIncidents = useMemo(() => {
    const start = (incidentsPage - 1) * incidentsLimit;
    return allFilteredIncidents.slice(start, start + incidentsLimit);
  }, [allFilteredIncidents, incidentsPage, incidentsLimit]);

  const getRiskBadgeColor = (risk: string): string => {
    switch (risk) {
      case 'very_high':
        return 'bg-rose-100 text-rose-700 border-rose-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'low':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getRiskLabel = (risk: string): string => {
    switch (risk) {
      case 'very_high':
        return '매우높음';
      case 'high':
        return '높음';
      case 'medium':
        return '중간';
      case 'low':
        return '낮음';
      default:
        return risk;
    }
  };

  const getErrorTypeLabel = (type: string): string => {
    if (!type) return '불명';

    // 공백 제거하여 정규화
    const normalized = type.replace(/\s+/g, '');

    switch (normalized) {
      case '관제사오류':
        return '관제사';
      case '조종사오류':
        return '조종사';
      case '오류미발생':
        return '불명';
      default:
        // DB에 예상치 못한 문자열이 와도 사용자에겐 "불명"으로 표시
        return '불명';
    }
  };

  return (
    <div className="space-y-6">
      {/* 통계 카드 섹션 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-600 mb-4 uppercase tracking-widest">
          📊 발생현황 요약
        </h3>

        {/* 메인 통계 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-4xl font-black text-gray-900">{stats.total}</span>
            <span className="text-sm font-medium text-gray-500">(유사호출부호 쌍)</span>
          </div>
          <div className="text-xs text-gray-500 mb-4">
            ※ 오류 유형별 건수는 발생 이력 기준이며, 전체 유사호출부호 쌍 수와 일치하지 않습니다.
          </div>

          {/* 3칸 카드 그리드 */}
          <div className="grid grid-cols-3 gap-3">
            {/* ATC 오류 */}
            <div className="border-2 border-rose-200 rounded-lg p-4 bg-rose-50 cursor-pointer hover:shadow-md transition-shadow">
              <div className="text-xs font-bold text-rose-600 uppercase mb-2">
                관제사 오류
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-700">{stats.atc}</span>
                <span className="text-xs font-bold text-rose-500">{stats.atcPercent}%</span>
              </div>
            </div>

            {/* PILOT 오류 */}
            <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50 cursor-pointer hover:shadow-md transition-shadow">
              <div className="text-xs font-bold text-orange-600 uppercase mb-2">
                조종사 오류
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-orange-700">{stats.pilot}</span>
                <span className="text-xs font-bold text-orange-500">{stats.pilotPercent}%</span>
              </div>
            </div>

            {/* 불명 */}
            <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50 cursor-pointer hover:shadow-md transition-shadow">
              <div className="text-xs font-bold text-emerald-600 uppercase mb-2">
                오류 미분류
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700">{stats.none}</span>
                <span className="text-xs font-bold text-emerald-500">{stats.nonePercent}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 바 */}
      <IncidentFilters
        startDate={startDate}
        endDate={endDate}
        activeRange={activeRange}
        isExporting={isExporting}
        incidentsLimit={incidentsLimit}
        incidentsSearchInput={incidentsSearchInput}
        allFilteredIncidentsCount={allFilteredIncidents.length}
        actionStatusFilter={actionStatusFilter}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        onActionStatusFilterChange={setActionStatusFilter}
        onSearchInputChange={onSearchInputChange}
        onSearchSubmit={onSearchSubmit}
        onLimitChange={onLimitChange}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onApplyQuickRange={onApplyQuickRange}
        onExport={onExport}
      />

      {/* 발생현황 카드 그리드 */}
      <div className="space-y-4">
        <div className="text-sm font-bold text-gray-600 flex items-center justify-between">
          <span>⚠️ 유사호출부호 발생현황 ({allFilteredIncidents.length}건)</span>
          <span className="text-xs text-gray-500">{incidentsPage} / {totalPages} 페이지</span>
        </div>

        {pagedIncidents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pagedIncidents.map((incident, idx) => (
              <div
                key={`${incident.pair}-${idx}`}
                className="bg-white border-l-4 border-gray-300 rounded-lg p-3 shadow-sm hover:shadow-md transition-all"
                style={{
                  borderLeftColor:
                    incident.risk === 'very_high'
                      ? '#dc2626'
                      : incident.risk === 'high'
                      ? '#f59e0b'
                      : incident.risk === 'medium'
                      ? '#eab308'
                      : '#16a34a',
                }}
              >
                {/* 헤더 */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const parts = incident.pair.split(' | ');
                      // 호출부호에서 airline code (앞 3글자) 추출
                      const airlineCode1 = (parts[0] || '').substring(0, 3);
                      const airlineCode2 = (parts[1] || '').substring(0, 3);
                      // 같은 항공사면 둘 다 파란색, 다르면 두 번째만 빨간색
                      const isSameAirline = airlineCode1 === airlineCode2;
                      
                      return (
                        <>
                          <span className="font-mono font-black text-base text-blue-600">
                            {parts[0] || incident.pair}
                          </span>
                          <span className="text-gray-400 text-sm">↔</span>
                          <span className={`font-mono font-black text-base ${isSameAirline ? 'text-blue-600' : 'text-red-600'}`}>
                            {parts[1] || ''}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  {/* 조치등록 버튼 or 조치완료 */}
                  {incident.actionStatus === 'completed' ? (
                    <div className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded border border-emerald-300">
                      ✓ 조치완료
                    </div>
                  ) : (
                    <button
                      onClick={() => onOpenActionModal(incident)}
                      className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors"
                    >
                      조치등록
                    </button>
                  )}
                </div>

                {/* 정보 테이블 */}
                <div className="grid grid-cols-4 gap-2 text-sm mb-2 pb-2 border-b border-gray-200">
                  <div>
                    <div className="text-[11px] text-gray-500 font-semibold mb-0.5">발생건수</div>
                    <div className="font-bold text-red-600 text-sm">{incident.count || 0}건</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 font-semibold mb-0.5">최근발생일</div>
                    <div className="font-bold text-gray-900 text-sm">
                      {incident.lastDate
                        ? new Date(incident.lastDate).toLocaleDateString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit',
                          })
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 font-semibold mb-0.5">유사성</div>
                    <div className={`font-bold text-sm ${
                      incident.similarity === '높음' || incident.similarity === 'high' ? 'text-red-600' :
                      incident.similarity === '중간' || incident.similarity === 'medium' ? 'text-orange-600' :
                      'text-emerald-600'
                    }`}>{incident.similarity}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 font-semibold mb-0.5">오류가능성</div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getRiskBadgeColor(
                        incident.risk
                      )}`}
                    >
                      {getRiskLabel(incident.risk)}
                    </span>
                  </div>
                </div>

                {/* 오류 유형별 집계 */}
                {incident.errorTypeSummary && incident.errorTypeSummary.length > 0 && (
                  <div className="mb-2 pb-2 border-b border-gray-200">
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">📊 오류유형</div>
                    <div className="flex flex-wrap gap-1.5">
                      {incident.errorTypeSummary.map((summary, i) => {
                        // 오류 유형별 색상 설정
                        const errorTypeColor = 
                          summary.errorType === '관제사오류' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          summary.errorType === '조종사오류' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200';
                        
                        return (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-semibold border ${errorTypeColor}`}
                          >
                            <span>{getErrorTypeLabel(summary.errorType)}</span>
                            <span className="font-black">({summary.count}건)</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 발생 이력 타임라인 */}
                {incident.occurrences && incident.occurrences.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">🕐 발생 이력</div>
                    <div className="flex flex-wrap gap-1.5">
                      {incident.occurrences.map((occurrence, i) => {
                        // 날짜 형식: YYYY-MM-DD → MM-DD
                        const dateStr = occurrence.occurredDate
                          ? occurrence.occurredDate.split('-').slice(1).join('-')
                          : '-';
                        // 시간 형식: YYYY-MM-DD HH:MM:SS → HH:MM 또는 HH:MM:SS → HH:MM
                        let timeStr = '';
                        if (occurrence.occurredTime) {
                          // 공백으로 분리된 경우 (YYYY-MM-DD HH:MM:SS)
                          if (occurrence.occurredTime.includes(' ')) {
                            timeStr = occurrence.occurredTime.split(' ')[1]?.substring(0, 5) || '';
                          } else {
                            // 시간만 있는 경우 (HH:MM:SS)
                            timeStr = occurrence.occurredTime.substring(0, 5);
                          }
                        }
                        
                        return (
                          <span
                            key={i}
                            className="inline-block text-[11px] bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono border border-gray-300"
                          >
                            {dateStr} {timeStr}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-12 text-center text-gray-500">
            <p className="text-sm">조회 기간 내 발생현황이 없습니다.</p>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => onPageChange(Math.max(1, incidentsPage - 1))}
              disabled={incidentsPage === 1}
              className="px-3 py-1 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:text-gray-300"
            >
              이전
            </button>
            <span className="text-sm text-gray-600">
              {incidentsPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, incidentsPage + 1))}
              disabled={incidentsPage === totalPages}
              className="px-3 py-1 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:text-gray-300"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
