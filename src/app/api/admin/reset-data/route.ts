/**
 * POST /api/admin/reset-data - 시스템 데이터 초기화 (관리자만)
 *
 * users와 airlines를 제외한 모든 데이터 삭제
 * 트랜잭션으로 일관성 보장
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query, transaction } from '@/lib/db';

// 관리자 인증 확인 헬퍼
function checkAdminAuth(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: true, message: '인증이 필요합니다.', status: 401 };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload || payload.role !== 'admin') {
    return { error: true, message: '관리자만 접근 가능합니다.', status: 403 };
  }

  return { error: false };
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = checkAdminAuth(request.headers.get('Authorization'));
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.message },
        { status: authCheck.status }
      );
    }

    const body = await request.json();
    const { confirmText } = body;

    // 확인 텍스트 검증 (실수 방지)
    if (confirmText !== 'RESET') {
      return NextResponse.json(
        { error: '확인 텍스트가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    // 트랜잭션으로 모든 삭제 작업 처리
    const result = await transaction(async (txQuery) => {
      const deletedCounts: Record<string, number> = {};

      // FK 순서에 맞춰 삭제
      // 1. announcement_views (announcements + users 참조)
      const result1 = await txQuery('DELETE FROM announcement_views');
      deletedCounts.announcement_views = result1.changes;

      // 2. action_history (actions 참조)
      const result2 = await txQuery('DELETE FROM action_history');
      deletedCounts.action_history = result2.changes;

      // 3. actions (airlines, callsigns, users 참조)
      const result3 = await txQuery('DELETE FROM actions');
      deletedCounts.actions = result3.changes;

      // 4. callsign_occurrences (callsigns 참조)
      const result4 = await txQuery('DELETE FROM callsign_occurrences');
      deletedCounts.callsign_occurrences = result4.changes;

      // 5. callsigns (airlines, file_uploads 참조)
      const result5 = await txQuery('DELETE FROM callsigns');
      deletedCounts.callsigns = result5.changes;

      // 6. announcements (users 참조)
      const result6 = await txQuery('DELETE FROM announcements');
      deletedCounts.announcements = result6.changes;

      // 7. file_uploads (users 참조)
      const result7 = await txQuery('DELETE FROM file_uploads');
      deletedCounts.file_uploads = result7.changes;

      // 8. audit_logs (users 참조)
      const result8 = await txQuery('DELETE FROM audit_logs');
      deletedCounts.audit_logs = result8.changes;

      // 9. password_history (users 참조)
      const result9 = await txQuery('DELETE FROM password_history');
      deletedCounts.password_history = result9.changes;

      return deletedCounts;
    });

    return NextResponse.json(
      {
        success: true,
        message: '데이터 초기화 완료',
        deletedCounts: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] 데이터 초기화 오류:', error);
    return NextResponse.json(
      { error: '데이터 초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
