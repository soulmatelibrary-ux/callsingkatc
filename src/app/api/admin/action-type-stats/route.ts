import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query } from '@/lib/db';

/**
 * GET /api/admin/action-type-stats
 *
 * 조치 유형별 분포 통계 조회
 * - 각 조치 유형별 건수
 * - 각 조치 유형별 완료율
 *
 * 응답:
 * {
 *   data: [
 *     {
 *       action_type: "편명 변경",
 *       total_count: 45,
 *       completed_count: 38,
 *       completion_rate: 84.4,
 *       in_progress_count: 5,
 *       pending_count: 2
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1️⃣ 인증 체크
    const token = request.headers.get('Authorization')?.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 체크
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 2️⃣ 조치 유형별 분포 통계 조회
    const statsRows = await query(
      `
      SELECT
        action_type,
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        ROUND(
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
          1
        ) as completion_rate
      FROM actions
      WHERE action_type IS NOT NULL AND action_type != ''
      GROUP BY action_type
      ORDER BY total_count DESC
      `,
      []
    );

    return NextResponse.json({
      data: statsRows.map((row) => ({
        action_type: row.action_type,
        total_count: row.total_count,
        completed_count: row.completed_count,
        in_progress_count: row.in_progress_count,
        pending_count: row.pending_count,
        completion_rate: row.completion_rate || 0,
      })),
    });
  } catch (error) {
    console.error('[API] /api/admin/action-type-stats error:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
