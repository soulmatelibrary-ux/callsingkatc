'use client';

import React, { useState, useEffect } from 'react';

interface OverviewData {
  id: string;
  registration_date: string;
  callsign_pair: string;
  error_type: string;
  sub_error: string;
  occurrence_count: number;
  last_occurred_at: string;
  airline1_code: string;
  airline1_name: string;
  airline2_code: string;
  airline2_name: string;
  action_status: '진행중' | '부분완료' | '완료';
  completion_date: string | null;
}

interface Summary {
  total: number;
  completed: number;
  partially_completed: number;
  in_progress: number;
}

export function OverviewTab() {
  const [data, setData] = useState<OverviewData[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    completed: 0,
    partially_completed: 0,
    in_progress: 0
  });
  const [loading, setLoading] = useState(true);

  // 필터 상태
  const [startDate, setStartDate] = useState('2026-02-04');
  const [endDate, setEndDate] = useState('2026-03-06');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const result = await response.json();
      setData(result.data);
      setSummary(result.summary);
    } catch (error) {
      console.error('Overview fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data
    .filter(item => {
      if (statusFilter !== 'all' && item.action_status !== statusFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.registration_date).getTime();
      const dateB = new Date(b.registration_date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료':
        return 'bg-emerald-100 text-emerald-700';
      case '부분완료':
        return 'bg-amber-100 text-amber-700';
      case '진행중':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
          <div className="text-3xl font-bold text-blue-600">{summary.total}</div>
          <div className="text-sm text-gray-600 mt-1">발생건수</div>
        </div>
        <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
          <div className="text-3xl font-bold text-green-600">{summary.completed}</div>
          <div className="text-sm text-gray-600 mt-1">조치완료</div>
        </div>
        <div className="border-2 border-amber-300 rounded-lg p-4 bg-amber-50">
          <div className="text-3xl font-bold text-amber-600">{summary.partially_completed}</div>
          <div className="text-sm text-gray-600 mt-1">부분완료</div>
        </div>
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="text-3xl font-bold text-gray-600">{summary.in_progress}</div>
          <div className="text-sm text-gray-600 mt-1">진행중</div>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="flex gap-3 items-center p-4 bg-gray-50 rounded-lg">
        <label className="text-sm font-semibold text-gray-600">조치기간:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded"
        />
        <span className="text-gray-400">~</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded"
        />

        <button
          onClick={() => setSortOrder('asc')}
          className={`px-3 py-1 text-sm rounded ${sortOrder === 'asc' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}
        >
          오름
        </button>
        <button
          onClick={() => setSortOrder('desc')}
          className={`px-3 py-1 text-sm rounded ${sortOrder === 'desc' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}
        >
          내림
        </button>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="all">전체</option>
          <option value="완료">완료</option>
          <option value="부분완료">부분완료</option>
          <option value="진행중">진행중</option>
        </select>

        <button
          onClick={fetchOverview}
          className="ml-auto px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          조회
        </button>
      </div>

      {/* 조치 목록 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-3 py-2 text-left text-gray-700 font-semibold">등록일</th>
              <th className="px-3 py-2 text-left text-gray-700 font-semibold">유사호출부호</th>
              <th className="px-3 py-2 text-left text-gray-700 font-semibold">조치유형</th>
              <th className="px-3 py-2 text-center text-gray-700 font-semibold">발생</th>
              <th className="px-3 py-2 text-left text-gray-700 font-semibold">최근발생일</th>
              <th className="px-3 py-2 text-left text-gray-700 font-semibold">항공사1</th>
              <th className="px-3 py-2 text-left text-gray-700 font-semibold">항공사2</th>
              <th className="px-3 py-2 text-left text-gray-700 font-semibold">조치완료일</th>
              <th className="px-3 py-2 text-center text-gray-700 font-semibold">조치현황</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-800">{item.registration_date}</td>
                <td className="px-3 py-2 font-mono font-bold text-gray-900">{item.callsign_pair}</td>
                <td className="px-3 py-2 text-gray-800">
                  <div className="text-xs">{item.error_type}</div>
                  <div className="text-xs text-gray-500">{item.sub_error}</div>
                </td>
                <td className="px-3 py-2 text-center text-gray-800 font-semibold">{item.occurrence_count}건</td>
                <td className="px-3 py-2 text-gray-800">{item.last_occurred_at}</td>
                <td className="px-3 py-2">
                  <div className="text-xs font-semibold">{item.airline1_code}</div>
                  <div className="text-xs text-gray-500">{item.airline1_name}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-xs font-semibold">{item.airline2_code}</div>
                  <div className="text-xs text-gray-500">{item.airline2_name}</div>
                </td>
                <td className="px-3 py-2 text-gray-800">{item.completion_date || '-'}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${getStatusColor(item.action_status)}`}>
                    {item.action_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <div className="text-center text-gray-500 py-8">로딩 중...</div>}
      {!loading && filteredData.length === 0 && (
        <div className="text-center text-gray-500 py-8">조치 현황이 없습니다.</div>
      )}
    </div>
  );
}
