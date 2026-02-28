'use client';

import React, { useMemo, useCallback, useState } from 'react';
import {
  Incident,
  DateRangeType,
  RISK_LEVEL_ORDER,
  ErrorType,
} from '@/types/airline';
import { IncidentSummaryCards } from './IncidentSummaryCards';
import { SubErrorAnalysis } from './SubErrorAnalysis';
import { IncidentFilters } from './IncidentFilters';
import { IncidentTable } from './IncidentTable';

interface IncidentsTabProps {
  incidents: Incident[];
  airlineCode: string;
  startDate: string;
  endDate: string;
  activeRange: DateRangeType;
  errorTypeFilter: 'all' | ErrorType;
  isExporting: boolean;
  // 페이징 / 검색
  incidentsPage: number;
  incidentsLimit: number;
  incidentsSearch: string;
  incidentsSearchInput: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  // 기존 핸들러
  onStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApplyQuickRange: (type: 'today' | '1w' | '2w' | '1m') => void;
  onErrorTypeFilterChange: (filter: 'all' | ErrorType) => void;
  onOpenActionModal: (incident: Incident) => void;
  onExport: () => void;
}

export function IncidentsTab({
  incidents,
  airlineCode,
  startDate,
  endDate,
  activeRange,
  errorTypeFilter,
  isExporting,
  incidentsPage,
  incidentsLimit,
  incidentsSearch,
  incidentsSearchInput,
  onPageChange,
  onLimitChange,
  onSearchInputChange,
  onSearchSubmit,
  onStartDateChange,
  onEndDateChange,
  onApplyQuickRange,
  onErrorTypeFilterChange,
  onOpenActionModal,
  onExport,
}: IncidentsTabProps) {
  // 분석 섹션 표시 토글
  const [showAnalysis, setShowAnalysis] = useState(false);

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

    // 호출부호 쌍 검색
    if (incidentsSearch.trim()) {
      const q = incidentsSearch.trim().toLowerCase();
      filtered = filtered.filter((i) => i.pair.toLowerCase().includes(q));
    }

    return filtered.sort((a, b) => {
      const riskA = RISK_LEVEL_ORDER[a.risk as keyof typeof RISK_LEVEL_ORDER] || 0;
      const riskB = RISK_LEVEL_ORDER[b.risk as keyof typeof RISK_LEVEL_ORDER] || 0;

      if (riskA !== riskB) {
        return riskB - riskA;
      }

      const countA = a.count || 0;
      const countB = b.count || 0;
      return countB - countA;
    });
  }, [filteredByDate, errorTypeFilter, incidentsSearch]);

  // 페이징
  const totalPages = Math.max(1, Math.ceil(allFilteredIncidents.length / incidentsLimit));
  const pagedIncidents = useMemo(() => {
    const start = (incidentsPage - 1) * incidentsLimit;
    return allFilteredIncidents.slice(start, start + incidentsLimit);
  }, [allFilteredIncidents, incidentsPage, incidentsLimit]);

  return (
    <>
      {/* 요약 통계 카드 */}
      <IncidentSummaryCards
        incidents={filteredByDate}
        errorTypeFilter={errorTypeFilter}
        onErrorTypeFilterChange={onErrorTypeFilterChange}
      />

      {/* 세부 오류분석 (collapsible) */}
      <SubErrorAnalysis
        incidents={filteredByDate}
        errorTypeFilter={errorTypeFilter}
        showAnalysis={showAnalysis}
        onToggleAnalysis={setShowAnalysis}
      />

      {/* 필터 바 */}
      <IncidentFilters
        startDate={startDate}
        endDate={endDate}
        activeRange={activeRange}
        isExporting={isExporting}
        incidentsLimit={incidentsLimit}
        incidentsSearchInput={incidentsSearchInput}
        allFilteredIncidentsCount={allFilteredIncidents.length}
        onSearchInputChange={onSearchInputChange}
        onSearchSubmit={onSearchSubmit}
        onLimitChange={onLimitChange}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onApplyQuickRange={onApplyQuickRange}
        onExport={onExport}
      />

      {/* 발생현황 테이블 */}
      <IncidentTable
        incidents={allFilteredIncidents}
        pagedIncidents={pagedIncidents}
        totalPages={totalPages}
        currentPage={incidentsPage}
        pageLimit={incidentsLimit}
        searchQuery={incidentsSearch}
        allFilteredCount={allFilteredIncidents.length}
        onPageChange={onPageChange}
        onOpenActionModal={onOpenActionModal}
      />
    </>
  );
}
