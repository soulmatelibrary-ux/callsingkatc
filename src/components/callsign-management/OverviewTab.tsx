'use client';

import { useState, useMemo } from 'react';
import { useCallsigns } from '@/hooks/useActions';
import { useAirlines } from '@/hooks/useAirlines';
import { StatCard } from './StatCard';

export function OverviewTab() {
  const [selectedAirline, setSelectedAirline] = useState<string>('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const airlinesQuery = useAirlines();
  const callsignsQuery = useCallsigns({
    airlineId: selectedAirline || undefined,
    riskLevel: selectedRiskLevel || undefined,
    page,
    limit,
  });

  // KPI 데이터 계산
  const stats = useMemo(() => {
    const data = callsignsQuery.data?.data || [];
    return {
      total: data.length,
      veryHigh: data.filter(c => c.risk_level === '매우높음').length,
      high: data.filter(c => c.risk_level === '높음').length,
      low: data.filter(c => c.risk_level === '낮음').length,
    };
  }, [callsignsQuery.data]);

  const getActionStatusMeta = (status?: string) => {
    const normalized = (status || 'pending').toLowerCase();
    switch (normalized) {
      case 'completed':
      case 'complete':
        return {
          label: '완료',
          bubble: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        };
      case 'pending':
      default:
        return {
          label: '진행중',
          bubble: 'bg-amber-50 text-amber-600 border-amber-100',
        };
    }
  };

  const handleReset = () => {
    setSelectedAirline('');
    setSelectedRiskLevel('');
    setPage(1);
  };

  if (callsignsQuery.isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
          Loading Data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <StatCard label="총 호출부호" value={stats.total} color="text-gray-900" />
        <StatCard label="매우높음" value={stats.veryHigh} color="text-red-600" />
        <StatCard label="높음" value={stats.high} color="text-amber-600" />
        <StatCard label="낮음" value={stats.low} color="text-emerald-600" />
      </div>

      {/* 호출부호 테이블 */}
      <div className="bg-white rounded-none shadow-sm border border-gray-100">
        {/* 헤더 */}
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">호출부호 목록</h3>
            <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">
              Call Signs List
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 rounded-none transition-all"
          >
            새로고침
          </button>
        </div>

        {/* 필터 */}
        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={selectedAirline}
              onChange={(e) => {
                setSelectedAirline(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 border border-gray-200 bg-white rounded-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold shadow-sm transition-all"
            >
              <option value="">항공사 선택</option>
              {airlinesQuery.data?.map((airline) => (
                <option key={airline.id} value={airline.id}>
                  {airline.code} - {airline.name_ko}
                </option>
              ))}
            </select>
            <select
              value={selectedRiskLevel}
              onChange={(e) => {
                setSelectedRiskLevel(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 border border-gray-200 bg-white rounded-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold shadow-sm transition-all"
            >
              <option value="">위험도 선택</option>
              <option value="매우높음">매우높음</option>
              <option value="높음">높음</option>
              <option value="낮음">낮음</option>
            </select>
          </div>
        </div>

        {/* 테이블 */}
        {(callsignsQuery.data?.data?.length || 0) > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white">
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    항공사
                  </th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    호출부호
                  </th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    위험도
                  </th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    발생횟수
                  </th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    최근 발생일
                  </th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    조치 상태
                  </th>
                  <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    등록일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {callsignsQuery.data?.data?.map((callsign) => (
                  <tr key={callsign.id} className="group hover:bg-primary/[0.02] transition-all">
                    <td className="px-8 py-5 font-bold text-gray-900">{callsign.airline_code}</td>
                    <td className="px-8 py-5 font-medium text-gray-700">{callsign.callsign_pair}</td>
                    <td className="px-8 py-5">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border ${callsign.risk_level === '매우높음'
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : callsign.risk_level === '높음'
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}
                      >
                        {callsign.risk_level}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-gray-900">{callsign.occurrence_count ?? '-'}</td>
                    <td className="px-8 py-5 text-gray-500 font-medium">
                      {callsign.last_occurred_at
                        ? new Date(callsign.last_occurred_at).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })
                        : '-'}
                    </td>
                    <td className="px-8 py-5">
                      {(() => {
                        const meta = getActionStatusMeta(callsign.latest_action_status);
                        return (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border ${meta.bubble}`}
                          >
                            {meta.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-8 py-5 text-gray-400 font-medium">
                      {callsign.uploaded_at
                        ? new Date(callsign.uploaded_at).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-8 py-12 text-center">
            <p className="text-sm font-bold text-gray-400 uppercase">No Data</p>
          </div>
        )}

        {/* 페이지네이션 */}
        <div className="px-8 py-6 border-t border-gray-50 flex justify-between items-center bg-gray-50/30">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            페이지 {page}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-200 rounded-none hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
            >
              이전
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(callsignsQuery.data?.data?.length || 0) < limit}
              className="px-3 py-1 border border-gray-200 rounded-none hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
