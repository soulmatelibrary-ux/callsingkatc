'use client';

import React, { useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Incident,
  ErrorTypeStat,
  DateRangeType,
  RISK_LEVEL_ORDER,
  ERROR_TYPE_CONFIG,
  ErrorType,
} from '@/types/airline';
import { Callsign } from '@/types/action';
import { formatDateInput } from '@/hooks/useDateRangeFilter';

interface IncidentsTabProps {
  incidents: Incident[];
  airlineCode: string;
  startDate: string;
  endDate: string;
  activeRange: DateRangeType;
  errorTypeFilter: 'all' | ErrorType;
  isExporting: boolean;
  onStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApplyQuickRange: (type: 'today' | '1w' | '2w' | '1m') => void;
  onErrorTypeFilterChange: (filter: 'all' | ErrorType) => void;
  onOpenActionModal: (incident: Incident) => void;
  onExport: () => void;
}

/**
 * 호출부호 쌍 분리 유틸리티
 */
function splitCallsignPair(pair: string): [string, string] | null {
  if (!pair) return null;
  const separators = ['↔', '|'];
  for (const separator of separators) {
    if (pair.includes(separator)) {
      const [left, right] = pair.split(separator);
      if (left && right) {
        return [left.trim(), right.trim()];
      }
    }
  }
  return null;
}

/**
 * 호출부호 문자별 색상 계산
 */
function getCallsignCharColors(my: string, other: string) {
  const myChars = Array.from(my);
  const otherChars = Array.from(other);
  const myColors = myChars.map(() => 'text-blue-700');
  const otherColors = otherChars.map(() => 'text-blue-700');
  const maxLength = Math.max(myChars.length, otherChars.length);

  for (let i = 0; i < maxLength; i += 1) {
    const myChar = myChars[i];
    const otherChar = otherChars[i];
    const isSame = myChar !== undefined && otherChar !== undefined && myChar === otherChar;

    if (!isSame) {
      if (myChar !== undefined) {
        myColors[i] = 'text-rose-700';
      }
      if (otherChar !== undefined) {
        otherColors[i] = 'text-rose-700';
      }
    }
  }

  return { myChars, otherChars, myColors, otherColors };
}

export function IncidentsTab({
  incidents,
  airlineCode,
  startDate,
  endDate,
  activeRange,
  errorTypeFilter,
  isExporting,
  onStartDateChange,
  onEndDateChange,
  onApplyQuickRange,
  onErrorTypeFilterChange,
  onOpenActionModal,
  onExport,
}: IncidentsTabProps) {
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

  // 전체 통계용 카운트
  const visibleIncidentCount = filteredByDate.length;

  // 동적 오류 유형별 통계 생성
  const errorTypeStats = useMemo<ErrorTypeStat[]>(() => {
    const uniqueTypes = Array.from(
      new Set(filteredByDate.map((i) => i.errorType).filter(Boolean))
    );

    return uniqueTypes.map((type) => {
      const count = filteredByDate.filter((i) => i.errorType === type).length;
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
  }, [filteredByDate, visibleIncidentCount]);

  // 에러 타입 + 정렬 적용된 최종 목록
  const allFilteredIncidents = useMemo(() => {
    const filtered =
      errorTypeFilter === 'all'
        ? filteredByDate
        : filteredByDate.filter((i) => i.errorType === errorTypeFilter);

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
  }, [filteredByDate, errorTypeFilter]);

  // 호출부호 렌더링 컴포넌트
  const CallsignPairDisplay = useCallback(
    ({ pair }: { pair: string }) => {
      const parts = splitCallsignPair(pair);
      if (!parts) return <span>{pair}</span>;

      const [my, other] = parts;
      const { myChars, otherChars, myColors, otherColors } = getCallsignCharColors(
        my,
        other
      );

      return (
        <div className="flex items-center gap-0.5">
          <div className="flex items-center gap-0">
            {myChars.map((char, idx) => (
              <span
                key={`my-${idx}`}
                className={`font-black text-2xl leading-none font-extrabold ${myColors[idx]}`}
              >
                {char}
              </span>
            ))}
          </div>
          <span className="text-gray-400 font-bold text-sm px-0.5">|</span>
          <div className="flex items-center gap-0">
            {otherChars.map((char, idx) => (
              <span
                key={`other-${idx}`}
                className={`font-black text-2xl leading-none font-extrabold ${otherColors[idx]}`}
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      );
    },
    []
  );

  return (
    <>
      {/* 요약 통계 - 상단 카드 */}
      {visibleIncidentCount > 0 && (
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
      )}

      {/* 조회 기간 필터 */}
      <div className="bg-white shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6 rounded-none">
        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 text-rose-700 rounded-none flex items-center justify-center">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                조회 기간
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={onStartDateChange}
                  className="bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer"
                />
                <span className="text-gray-300">~</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={onEndDateChange}
                  className="bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex bg-gray-50/50 p-1 rounded-none border border-gray-100">
            {(['today', '1w', '2w', '1m'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => onApplyQuickRange(range)}
                className={`px-4 py-2 rounded-none text-xs font-black tracking-tight transition-all ${
                  activeRange === range
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {range === 'today' ? '오늘' : range === '1w' ? '1주' : range === '2w' ? '2주' : '1개월'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={onExport}
            disabled={isExporting || allFilteredIncidents.length === 0}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-none font-bold shadow-sm transition-all text-sm border ${
              isExporting || allFilteredIncidents.length === 0
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
            <span>{isExporting ? '내보내는 중...' : 'Excel 내보내기'}</span>
          </button>
        </div>
      </div>

      {/* 발생현황 테이블 */}
      <div className="bg-white rounded-none shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <div className="divide-y divide-gray-50">
            {allFilteredIncidents.map((incident) => (
              <div
                key={incident.id}
                className={`border-b-2 border-gray-100 last:border-b-0 border-l-4 ${
                  incident.risk === '매우높음'
                    ? 'border-l-red-600'
                    : incident.risk === '높음'
                    ? 'border-l-amber-500'
                    : 'border-l-emerald-600'
                }`}
              >
                {/* 첫 번째 행: 호출부호 | 분류 정보 태그 | 조치 버튼 */}
                <div className="px-6 py-3 flex items-center justify-between gap-5 group hover:bg-slate-50 transition-colors border-b border-gray-50">
                  <div className="flex items-center gap-1 flex-shrink-0 bg-gray-50 rounded-none px-2 py-0.5">
                    <CallsignPairDisplay pair={incident.pair} />
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <span
                      className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-none ${
                        incident.errorType === '관제사 오류'
                          ? 'text-rose-600 bg-rose-50'
                          : incident.errorType === '조종사 오류'
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-emerald-600 bg-emerald-50'
                      }`}
                    >
                      {incident.errorType}
                    </span>
                    {incident.subError && (
                      <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-none text-indigo-600 bg-indigo-50">
                        {incident.subError}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenActionModal(incident)}
                    className="flex-shrink-0 px-3 py-1.5 bg-rose-700 text-white text-[10px] font-black rounded-none shadow-none hover:bg-rose-800 transition-all uppercase tracking-widest whitespace-nowrap"
                  >
                    조치 등록
                  </button>
                </div>

                {/* 두 번째 행: 상세 정보 */}
                <div className="px-6 py-4 bg-gray-50/40 grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="rounded-none bg-gray-50 border border-gray-200 px-3 py-2 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      발생건수
                    </span>
                    <span
                      className={`text-base font-black ${
                        incident.risk === '매우높음'
                          ? 'text-rose-600'
                          : incident.risk === '높음'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {incident.count}건
                    </span>
                  </div>

                  <div className="rounded-none bg-gray-50 border border-gray-200 px-3 py-2 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      최초 발생일
                    </span>
                    <span className="text-[13px] font-bold text-gray-900">
                      {incident.firstDate
                        ? new Date(incident.firstDate).toLocaleDateString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit',
                          })
                        : '-'}
                    </span>
                  </div>

                  <div className="rounded-none bg-gray-50 border border-gray-200 px-3 py-2 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      최근 발생일
                    </span>
                    <span className="text-[13px] font-bold text-gray-900">
                      {incident.lastDate
                        ? new Date(incident.lastDate).toLocaleDateString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit',
                          })
                        : '-'}
                    </span>
                  </div>

                  <div className="rounded-none bg-gray-50 border border-gray-200 px-3 py-2 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      유사성
                    </span>
                    <span className="text-[13px] font-bold text-gray-900">
                      {incident.similarity}
                    </span>
                  </div>

                  <div className="rounded-none bg-gray-50 border border-gray-200 px-3 py-2 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      오류가능성
                    </span>
                    <span
                      className={`text-[13px] font-black ${
                        incident.risk === '매우높음'
                          ? 'text-rose-600'
                          : incident.risk === '높음'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {incident.risk}
                    </span>
                  </div>
                </div>

                {/* 세 번째 행: 발생 이력 */}
                {incident.dates && incident.dates.length > 0 && (
                  <>
                    <div className="px-8 border-t border-dashed border-gray-200" />
                    <div className="px-8 py-4 flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">📅</span>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2 self-center">
                          발생 이력
                        </span>
                        {incident.dates.map((date, idx) => (
                          <span
                            key={idx}
                            className="inline-block text-xs font-bold px-3 py-1 rounded-none bg-blue-50 text-blue-600"
                          >
                            {new Date(date).toLocaleDateString('ko-KR', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {allFilteredIncidents.length === 0 && (
        <div className="bg-white rounded-none p-12 text-center shadow-sm border border-gray-100">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-gray-500 font-bold">
            등록된 유사호출부호 발생 이력이 없습니다
          </p>
        </div>
      )}
    </>
  );
}
