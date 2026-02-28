'use client';

import React, { useMemo, useCallback } from 'react';
import { Incident } from '@/types/airline';

interface IncidentTableProps {
  incidents: Incident[];
  pagedIncidents: Incident[];
  totalPages: number;
  currentPage: number;
  pageLimit: number;
  searchQuery: string;
  allFilteredCount: number;

  onPageChange: (page: number) => void;
  onOpenActionModal: (incident: Incident) => void;
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

// 호출부호 렌더링 컴포넌트
function CallsignPairDisplay({ pair }: { pair: string }) {
  const parts = splitCallsignPair(pair);
  if (!parts) return <span>{pair}</span>;

  const [my, other] = parts;
  const { myChars, otherChars, myColors, otherColors } = getCallsignCharColors(my, other);

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
}

export function IncidentTable({
  incidents: allIncidents,
  pagedIncidents,
  totalPages,
  currentPage,
  pageLimit,
  searchQuery,
  allFilteredCount,
  onPageChange,
  onOpenActionModal,
}: IncidentTableProps) {
  const formatDisplayDate = useCallback((value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }, []);

  return (
    <>
      {/* 발생현황 테이블 */}
      <div className="bg-white rounded-none shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* 총 개수 표시 */}
        <div className="px-8 py-4 border-b border-gray-50 flex items-center justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Total {allFilteredCount} Cases
          </span>
          {searchQuery && (
            <span className="text-[10px] font-bold text-rose-600">
              &quot;{searchQuery}&quot; 검색 결과
            </span>
          )}
        </div>

        {/* 테이블 행 */}
        <div className="overflow-x-auto flex-1">
          <div className="divide-y divide-gray-50">
            {pagedIncidents.map((incident) => (
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
                    {/* 조치 상태 배지 */}
                    {incident.actionStatus && incident.actionStatus !== 'no_action' && (
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-none ${
                        incident.actionStatus === 'completed'
                          ? 'text-emerald-600 bg-emerald-50'
                          : incident.actionStatus === 'in_progress'
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-amber-600 bg-amber-50'
                      }`}>
                        조치중
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* 조치 상태 표시 */}
                    {incident.actionStatus === 'completed' && (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-none whitespace-nowrap">
                        완료
                      </span>
                    )}
                    {incident.actionStatus === 'in_progress' && (
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-none whitespace-nowrap">
                        조치중
                      </span>
                    )}
                    {incident.actionStatus === 'pending' && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-none whitespace-nowrap">
                        미조치
                      </span>
                    )}
                    <button
                      onClick={() => onOpenActionModal(incident)}
                      className={`flex-shrink-0 px-3 py-1.5 text-white text-[10px] font-black rounded-none shadow-none transition-all uppercase tracking-widest whitespace-nowrap ${
                        incident.actionStatus === 'completed'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-rose-700 hover:bg-rose-800'
                      }`}
                    >
                      {incident.actionStatus === 'completed' ? '조치 보기' : '조치 등록'}
                    </button>
                  </div>
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
                      {formatDisplayDate(incident.firstDate)}
                    </span>
                  </div>

                  <div className="rounded-none bg-gray-50 border border-gray-200 px-3 py-2 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      최근 발생일
                    </span>
                    <span className="text-[13px] font-bold text-gray-900">
                      {formatDisplayDate(incident.lastDate)}
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
                        {incident.dates.map((date) => (
                          <span
                            key={`date-${date}`}
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

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-gray-50 flex justify-center items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-none border border-gray-200 text-gray-400 hover:text-rose-700 hover:border-rose-700 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all font-black text-xs"
            >
              PREV
            </button>

            <div className="flex gap-1 mx-4">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                const pageNum = startPage + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-10 h-10 rounded-none text-xs font-black transition-all border border-transparent ${
                      pageNum === currentPage
                        ? 'bg-rose-700 text-white shadow-none'
                        : 'text-gray-400 hover:text-gray-900 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-none border border-gray-200 text-gray-400 hover:text-rose-700 hover:border-rose-700 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all font-black text-xs"
            >
              NEXT
            </button>
          </div>
        )}
      </div>

      {/* 데이터 없음 상태 */}
      {allFilteredCount === 0 && (
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
