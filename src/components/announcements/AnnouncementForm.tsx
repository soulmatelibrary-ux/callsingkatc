'use client';

import { useState } from 'react';
import { useCreateAnnouncement, useUpdateAnnouncement } from '@/hooks/useAnnouncements';
import { ANNOUNCEMENT_LEVEL } from '@/lib/constants';
import { Announcement } from '@/types/announcement';

interface Props {
  announcement?: Announcement;
  onSuccess?: () => void;
}

/**
 * AnnouncementForm - 공지사항 생성/수정 폼
 *
 * 기능:
 * - 신규/수정 모드 지원
 * - 유효성 검사 (시간 범위 등)
 * - 항공사 선택 (전체 또는 특정)
 * - 로딩/에러 상태
 */
export function AnnouncementForm({ announcement, onSuccess }: Props) {
  const isEdit = !!announcement;

  const [form, setForm] = useState({
    title: announcement?.title || '',
    content: announcement?.content || '',
    level: announcement?.level || 'info' as 'warning' | 'info' | 'success',
    startDate: announcement?.startDate
      ? new Date(announcement.startDate).toISOString().slice(0, 16)
      : '',
    endDate: announcement?.endDate
      ? new Date(announcement.endDate).toISOString().slice(0, 16)
      : '',
    targetAirlines: announcement?.targetAirlines
      ? announcement.targetAirlines.split(',')
      : [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // 폼 유효성 검사
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }

    if (!form.content.trim()) {
      newErrors.content = '내용을 입력해주세요.';
    }

    if (!form.startDate) {
      newErrors.startDate = '시작일을 선택해주세요.';
    }

    if (!form.endDate) {
      newErrors.endDate = '종료일을 선택해주세요.';
    }

    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);

      if (start >= end) {
        newErrors.dateRange = '시작일은 종료일보다 전에 있어야 합니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: announcement!.id,
          title: form.title,
          content: form.content,
          level: form.level,
          startDate: form.startDate,
          endDate: form.endDate,
          targetAirlines:
            form.targetAirlines.length > 0 ? form.targetAirlines : undefined,
        });
      } else {
        await createMutation.mutateAsync({
          title: form.title,
          content: form.content,
          level: form.level,
          startDate: form.startDate,
          endDate: form.endDate,
          targetAirlines:
            form.targetAirlines.length > 0 ? form.targetAirlines : undefined,
        });
      }

      // 성공
      if (onSuccess) {
        onSuccess();
      } else {
        // 폼 초기화
        setForm({
          title: '',
          content: '',
          level: 'info',
          startDate: '',
          endDate: '',
          targetAirlines: [],
        });
      }
    } catch (error) {
      console.error('Form submit error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg border p-6">
      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          제목 *
        </label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="공지사항 제목 입력"
          className="w-full border rounded px-3 py-2"
          disabled={isLoading}
        />
        {errors.title && (
          <p className="text-xs text-red-600 mt-1">{errors.title}</p>
        )}
      </div>

      {/* 내용 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          내용 *
        </label>
        <textarea
          value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })}
          placeholder="공지사항 내용 입력"
          rows={5}
          className="w-full border rounded px-3 py-2"
          disabled={isLoading}
        />
        {errors.content && (
          <p className="text-xs text-red-600 mt-1">{errors.content}</p>
        )}
      </div>

      {/* 긴급도 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          긴급도
        </label>
        <select
          value={form.level}
          onChange={e =>
            setForm({
              ...form,
              level: e.target.value as 'warning' | 'info' | 'success',
            })
          }
          className="w-full border rounded px-3 py-2"
          disabled={isLoading}
        >
          <option value="info">📢 일반</option>
          <option value="warning">🚨 경고</option>
          <option value="success">✅ 완료</option>
        </select>
      </div>

      {/* 시작일 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          시작일 *
        </label>
        <input
          type="datetime-local"
          value={form.startDate}
          onChange={e => setForm({ ...form, startDate: e.target.value })}
          className="w-full border rounded px-3 py-2"
          disabled={isLoading}
        />
        {errors.startDate && (
          <p className="text-xs text-red-600 mt-1">{errors.startDate}</p>
        )}
      </div>

      {/* 종료일 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          종료일 *
        </label>
        <input
          type="datetime-local"
          value={form.endDate}
          onChange={e => setForm({ ...form, endDate: e.target.value })}
          className="w-full border rounded px-3 py-2"
          disabled={isLoading}
        />
        {errors.endDate && (
          <p className="text-xs text-red-600 mt-1">{errors.endDate}</p>
        )}
      </div>

      {/* 날짜 범위 에러 */}
      {errors.dateRange && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {errors.dateRange}
        </div>
      )}

      {/* 뮤테이션 에러 */}
      {(createMutation.error || updateMutation.error) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {(createMutation.error || updateMutation.error)?.message ||
            '오류가 발생했습니다.'}
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition"
        >
          {isLoading
            ? '저장 중...'
            : isEdit
              ? '수정'
              : '생성'}
        </button>
      </div>
    </form>
  );
}
