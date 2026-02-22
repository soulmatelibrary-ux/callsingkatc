'use client';

import { AdminAnnouncementResponse, Announcement } from '@/types/announcement';
import { ANNOUNCEMENT_LEVEL_COLORS } from '@/lib/constants';
import { useDeleteAnnouncement } from '@/hooks/useAnnouncements';
import { useState } from 'react';

interface Props {
  announcement: AdminAnnouncementResponse | Announcement;
  onClose: () => void;
  isAdmin?: boolean;
  onEdit?: (announcement: AdminAnnouncementResponse | Announcement) => void;
}

/**
 * AnnouncementDetailModal - 공지사항 상세 보기 모달
 *
 * 기능:
 * - 공지사항 상세 정보 표시 (제목, 내용, 기간, 대상 항공사 등)
 * - 관리자 모드: 수정/삭제 버튼
 * - 모달 오버레이
 */
export function AnnouncementDetailModal({
  announcement,
  onClose,
  isAdmin = false,
  onEdit,
}: Props) {
  const colors = ANNOUNCEMENT_LEVEL_COLORS[announcement.level];
  const isActive =
    new Date(announcement.startDate) <= new Date() &&
    new Date(announcement.endDate) >= new Date();

  const deleteMutation = useDeleteAnnouncement();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('정말 이 공지사항을 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(announcement.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const targetAirlines = announcement.targetAirlines
    ? announcement.targetAirlines.split(',').map(code => code.trim())
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{announcement.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  colors.badge
                }`}
              >
                {getLevelLabel(announcement.level)}
              </span>
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-green-700' : 'text-gray-500'
                }`}
              >
                {isActive ? '활성' : '종료'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="px-6 py-4 space-y-6">
          {/* 메타정보 */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">시작일</p>
              <p className="text-sm text-gray-900">
                {new Date(announcement.startDate).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">종료일</p>
              <p className="text-sm text-gray-900">
                {new Date(announcement.endDate).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">작성일</p>
              <p className="text-sm text-gray-900">
                {new Date(announcement.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
            {isAdmin && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">조회수</p>
                <p className="text-sm text-gray-900">
                  {(announcement as AdminAnnouncementResponse).viewCount || 0}명
                </p>
              </div>
            )}
          </div>

          {/* 대상 항공사 */}
          {targetAirlines && targetAirlines.length > 0 && (
            <div className="pb-4 border-b">
              <p className="text-xs font-medium text-gray-500 mb-2">대상항공사</p>
              <div className="flex flex-wrap gap-2">
                {targetAirlines.map(code => (
                  <span
                    key={code}
                    className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!targetAirlines && (
            <div className="pb-4 border-b">
              <p className="text-xs font-medium text-gray-500 mb-2">대상항공사</p>
              <p className="text-sm text-gray-600">모든 항공사</p>
            </div>
          )}

          {/* 내용 */}
          <div className="pb-4 border-b">
            <p className="text-xs font-medium text-gray-500 mb-2">내용</p>
            <div className="bg-gray-50 rounded p-4 text-sm text-gray-900 whitespace-pre-wrap">
              {announcement.content}
            </div>
          </div>

          {/* 작성자 정보 (관리자만) */}
          {isAdmin && (
            <div className="pb-4 border-b text-xs text-gray-500">
              <p>
                작성자: {announcement.createdByEmail || announcement.createdBy}
              </p>
              {announcement.updatedBy && (
                <p>
                  마지막 수정: {announcement.updatedBy}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-100 font-medium transition"
          >
            닫기
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit?.(announcement)}
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-medium transition"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 긴급도 라벨
 */
function getLevelLabel(level: string): string {
  switch (level) {
    case 'warning':
      return '🚨 경고';
    case 'success':
      return '✅ 완료';
    case 'info':
    default:
      return '📢 일반';
  }
}
