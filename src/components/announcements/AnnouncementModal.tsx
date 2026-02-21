'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useActiveAnnouncements, useViewAnnouncement } from '@/hooks/useAnnouncements';
import { ANNOUNCEMENT_LEVEL_COLORS } from '@/lib/constants';

/**
 * AnnouncementModal - 활성 공지사항 팝업
 *
 * 특징:
 * - 로그인 후 활성 공지사항 팝업으로 표시
 * - 기간 내 공지사항만 자동 필터
 * - Session Storage로 닫음 상태 관리 (탭 닫으면 초기화)
 * - 첫 번째 미닫음 공지사항만 표시
 * - 닫기 버튼으로 세션 내 재표시 안 함
 */
export function AnnouncementModal() {
  const { data } = useActiveAnnouncements();
  const { mutate: recordView } = useViewAnnouncement();

  // 팝업 닫음 상태 (Session Storage)
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Session Storage에서 닫음 상태 복원
  useEffect(() => {
    setMounted(true);
    const saved = sessionStorage.getItem('dismissedAnnouncements');
    if (saved) {
      try {
        setDismissed(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse dismissed announcements:', e);
      }
    }
  }, []);

  if (!mounted) return null;

  // 표시할 공지사항 찾기 (첫 번째 미닫음)
  const announcements = data?.announcements || [];
  const toShow = announcements.find(a => !dismissed.includes(a.id));

  if (!toShow) return null; // 표시할 공지사항 없음

  const handleDismiss = () => {
    const updated = [...dismissed, toShow.id];
    setDismissed(updated);
    sessionStorage.setItem('dismissedAnnouncements', JSON.stringify(updated));

    // 읽음 상태 기록
    recordView(toShow.id);
  };

  const handleDetail = () => {
    handleDismiss();
    // 상세 조회는 컴포넌트 외부에서 라우팅으로 처리
  };

  // 긴급도별 색상
  const colors = ANNOUNCEMENT_LEVEL_COLORS[toShow.level];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`rounded-lg border-2 p-6 max-w-md shadow-lg ${colors.bg} ${colors.border}`}
      >
        {/* 헤더 */}
        <div className="mb-4">
          <h2 className={`text-lg font-bold mb-1 ${colors.text}`}>
            {getAnnouncementEmoji(toShow.level)} {toShow.title}
          </h2>
          <p className="text-xs text-gray-500">
            {new Date(toShow.startDate).toLocaleDateString('ko-KR')} ~{' '}
            {new Date(toShow.endDate).toLocaleDateString('ko-KR')}
          </p>
        </div>

        {/* 내용 */}
        <p className={`text-sm mb-6 line-clamp-4 ${colors.text}`}>
          {toShow.content}
        </p>

        {/* 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded font-medium transition"
          >
            닫기
          </button>
          <Link
            href={`/announcements/${toShow.id}`}
            onClick={handleDetail}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium text-center transition"
          >
            자세히
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * 긴급도별 이모지
 */
function getAnnouncementEmoji(level: string): string {
  switch (level) {
    case 'warning':
      return '🚨';
    case 'success':
      return '✅';
    case 'info':
    default:
      return '📢';
  }
}
