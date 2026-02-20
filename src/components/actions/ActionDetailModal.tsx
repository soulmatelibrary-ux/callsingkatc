'use client';

import { useState } from 'react';
import { Action } from '@/types/action';
import { useUpdateAction } from '@/hooks/useActions';

interface ActionDetailModalProps {
  action: Action;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ActionDetailModal({ action, onClose, onSuccess }: ActionDetailModalProps) {
  const [formData, setFormData] = useState({
    action_type: action.action_type,
    description: action.description || '',
    manager_name: action.manager_name || '',
    manager_email: action.manager_email || '',
    planned_due_date: action.planned_due_date || '',
    status: action.status,
    result_detail: action.result_detail || '',
  });

  const updateMutation = useUpdateAction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync(
      {
        id: action.id,
        ...formData,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  const statusLabels = {
    pending: '대기중',
    in_progress: '진행중',
    completed: '완료',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">조치 상세 · 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 호출부호 (읽기전용) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              유사호출부호
            </label>
            <input
              type="text"
              value={action.callsign?.callsign_pair || '-'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          {/* 항공사 (읽기전용) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              항공사
            </label>
            <input
              type="text"
              value={action.airline?.name_ko || '-'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          {/* 조치 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              조치유형 *
            </label>
            <input
              type="text"
              value={formData.action_type}
              onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="편명 변경, 브리핑 시행 등"
            />
          </div>

          {/* 담당자 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                담당자 *
              </label>
              <input
                type="text"
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                담당자 이메일
              </label>
              <input
                type="email"
                value={formData.manager_email}
                onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 등록일 (읽기전용) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              등록일
            </label>
            <input
              type="text"
              value={new Date(action.registered_at).toLocaleDateString('ko-KR')}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          {/* 조치 예정일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              조치 예정일
            </label>
            <input
              type="date"
              value={formData.planned_due_date ? formData.planned_due_date.split('T')[0] : ''}
              onChange={(e) => setFormData({ ...formData, planned_due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 상세 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상세내용
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="조치에 대한 상세 설명"
            />
          </div>

          {/* 상태 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태 *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">대기중</option>
              <option value="in_progress">진행중</option>
              <option value="completed">완료</option>
            </select>
          </div>

          {/* 결과 상세 (완료 시에만) */}
          {formData.status === 'completed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                결과 상세
              </label>
              <textarea
                value={formData.result_detail}
                onChange={(e) => setFormData({ ...formData, result_detail: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="조치 완료 결과"
              />
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
