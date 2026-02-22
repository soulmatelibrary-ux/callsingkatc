'use client';

import { Announcement } from '@/types/announcement';
import { AnnouncementForm } from './AnnouncementForm';

interface Props {
  announcement?: Announcement;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * AnnouncementFormModal - 공지사항 작성/수정 모달
 *
 * AnnouncementForm을 모달 오버레이로 감싼 래퍼
 *
 * 기능:
 * - 신규/수정 모드 지원
 * - 모달 오버레이
 * - 닫기 버튼 (X)
 */
export function AnnouncementFormModal({ announcement, onClose, onSuccess }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {announcement ? '공지사항 수정' : '공지사항 작성'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* 폼 */}
        <div className="p-6">
          <AnnouncementForm
            announcement={announcement}
            onSuccess={() => {
              onSuccess?.();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
