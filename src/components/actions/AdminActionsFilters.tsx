"use client";

import { Airline } from '@/hooks/useAirlines';

type ActionStatus = '' | 'pending' | 'in_progress' | 'completed';

interface AdminActionsFiltersProps {
  airlines: Airline[];
  airlinesLoading: boolean;
  selectedAirlineId: string;
  selectedStatus: ActionStatus;
  dateFrom: string;
  dateTo: string;
  onAirlineChange: (value: string) => void;
  onStatusChange: (value: ActionStatus) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onReset: () => void;
  onOpenCreate: () => void;
  onExport: () => void;
  canCreate: boolean;
  canExport: boolean;
  summary?: {
    total: number;
    selectedStatusLabel?: string;
    filteredCount?: number;
  };
}

export function AdminActionsFilters({
  airlines,
  airlinesLoading,
  selectedAirlineId,
  selectedStatus,
  dateFrom,
  dateTo,
  onAirlineChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onReset,
  onOpenCreate,
  onExport,
  canCreate,
  canExport,
  summary,
}: AdminActionsFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">항공사</label>
          <select
            value={selectedAirlineId}
            onChange={(e) => onAirlineChange(e.target.value)}
            disabled={airlinesLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">모든 항공사</option>
            {airlines.map((airline) => (
              <option key={airline.id} value={airline.id}>
                {airline.code} - {airline.name_ko}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as ActionStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 상태</option>
            <option value="pending">대기중</option>
            <option value="in_progress">진행중</option>
            <option value="completed">완료</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">시작 날짜</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">종료 날짜</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={onReset}
            className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onOpenCreate}
          disabled={!canCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          조치 등록
        </button>
        <button
          onClick={onExport}
          disabled={!canExport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          Excel 내보내기
        </button>
      </div>

      {summary && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            전체: <span className="font-semibold">{summary.total}</span>건
            {summary.selectedStatusLabel && ' / '}
            {summary.selectedStatusLabel && (
              <>
                {summary.selectedStatusLabel}: <span className="font-semibold">{summary.filteredCount ?? 0}건</span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
