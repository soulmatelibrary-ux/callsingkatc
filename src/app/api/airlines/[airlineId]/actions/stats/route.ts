/**
 * GET /api/airlines/[airlineId]/actions/stats
 * 항공사별 조치 통계 집계
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { airlineId: string } }
) {
  try {
    const airlineId = params.airlineId;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    // 항공사 존재 여부 확인
    const airlineResult = await query('SELECT id FROM airlines WHERE id = $1', [airlineId]);
    if (airlineResult.rows.length === 0) {
      return NextResponse.json({ error: '항공사를 찾을 수 없습니다.' }, { status: 404 });
    }

    const summaryResult = await query(
      `SELECT
         COUNT(*)::int AS total_callsigns,
         COUNT(*) FILTER (WHERE a.id IS NULL)::int AS awaiting_count,
         COUNT(*) FILTER (WHERE a.status = 'pending')::int AS pending_action_count,
         COUNT(*) FILTER (WHERE a.status = 'in_progress')::int AS in_progress_action_count,
         COUNT(*) FILTER (WHERE a.status = 'completed')::int AS completed_count
       FROM callsigns cs
       LEFT JOIN actions a ON cs.id = a.callsign_id
       WHERE cs.airline_id = $1`,
      [airlineId]
    );

    const summaryRow = summaryResult.rows[0] || {
      total_callsigns: 0,
      awaiting_count: 0,
      pending_action_count: 0,
      in_progress_action_count: 0,
      completed_count: 0,
    };

    const total = summaryRow.total_callsigns || 0;
    const waitingCount = (summaryRow.awaiting_count || 0) + (summaryRow.pending_action_count || 0);
    const inProgressCount = summaryRow.in_progress_action_count || 0;
    const completedCount = summaryRow.completed_count || 0;

    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const avgResult = await query(
      `SELECT AVG(EXTRACT(EPOCH FROM (completed_at - registered_at)) / 86400) AS avg_days
       FROM actions
       WHERE airline_id = $1
         AND completed_at IS NOT NULL
         AND registered_at IS NOT NULL`,
      [airlineId]
    );
    const averageCompletionDays = avgResult.rows[0]?.avg_days ? Math.round(avgResult.rows[0].avg_days) : 0;

    const typeResult = await query(
      `SELECT COALESCE(a.action_type, '미정의') AS action_type, COUNT(*)::int AS count
       FROM callsigns cs
       LEFT JOIN actions a ON cs.id = a.callsign_id
       WHERE cs.airline_id = $1
       GROUP BY 1
       ORDER BY count DESC`,
      [airlineId]
    );

    const typeDistribution = typeResult.rows.map((row: any) => ({
      name: row.action_type || '미정의',
      count: row.count,
      percentage: total > 0 ? Math.round((row.count / total) * 100) : 0,
    }));

    const monthlyResult = await query(
      `SELECT TO_CHAR(registered_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
       FROM actions
       WHERE airline_id = $1
       GROUP BY month
       ORDER BY month DESC
       LIMIT 6`,
      [airlineId]
    );

    const monthlyTrend = monthlyResult.rows.map((row: any) => ({
      month: row.month,
      count: row.count,
    }));

    return NextResponse.json({
      total,
      completionRate,
      averageCompletionDays,
      statusCounts: {
        waiting: waitingCount,
        in_progress: inProgressCount,
        completed: completedCount,
      },
      typeDistribution,
      monthlyTrend,
    });
  } catch (error) {
    console.error('조치 통계 조회 오류:', error);
    return NextResponse.json(
      { error: '조치 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
