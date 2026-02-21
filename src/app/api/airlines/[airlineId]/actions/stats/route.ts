/**
 * GET /api/airlines/[airlineId]/actions/stats
 * 항공사별 조치 통계 집계
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query } from '@/lib/db';

function toDateOnlyString(date: Date) {
  return date.toISOString().split('T')[0];
}

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

    const dateFromParam = request.nextUrl.searchParams.get('dateFrom');
    const dateToParam = request.nextUrl.searchParams.get('dateTo');

    const now = new Date();
    const defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const defaultStart = new Date(defaultEnd);
    defaultStart.setDate(defaultEnd.getDate() - 29);

    const dateFrom = dateFromParam ? new Date(dateFromParam) : defaultStart;
    const dateTo = dateToParam ? new Date(dateToParam) : defaultEnd;

    if (Number.isNaN(dateFrom.getTime()) || Number.isNaN(dateTo.getTime())) {
      return NextResponse.json({ error: '유효하지 않은 날짜 형식입니다.' }, { status: 400 });
    }

    if (dateFrom > dateTo) {
      return NextResponse.json({ error: '조회 시작일이 종료일보다 늦을 수 없습니다.' }, { status: 400 });
    }

    const fromDateString = toDateOnlyString(dateFrom);
    const toDateString = toDateOnlyString(dateTo);

    const summaryResult = await query(
      `SELECT
         COUNT(*)::int AS total_actions,
         COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_count,
         COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress_count,
         COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_count
       FROM actions
       WHERE airline_id = $1
         AND registered_at::date BETWEEN $2::date AND $3::date`,
      [airlineId, fromDateString, toDateString]
    );

    const summaryRow = summaryResult.rows[0] || {
      total_actions: 0,
      pending_count: 0,
      in_progress_count: 0,
      completed_count: 0,
    };

    const total = summaryRow.total_actions || 0;
    const waitingCount = summaryRow.pending_count || 0;
    const inProgressCount = summaryRow.in_progress_count || 0;
    const completedCount = summaryRow.completed_count || 0;

    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const avgResult = await query(
      `SELECT AVG(EXTRACT(EPOCH FROM (completed_at - registered_at)) / 86400) AS avg_days
       FROM actions
       WHERE airline_id = $1
         AND status = 'completed'
         AND completed_at IS NOT NULL
         AND registered_at IS NOT NULL
         AND registered_at::date BETWEEN $2::date AND $3::date`,
      [airlineId, fromDateString, toDateString]
    );
    const averageCompletionDays = avgResult.rows[0]?.avg_days ? Math.round(avgResult.rows[0].avg_days) : 0;

    const typeResult = await query(
      `SELECT COALESCE(action_type, '미정의') AS action_type, COUNT(*)::int AS count
       FROM actions
       WHERE airline_id = $1
         AND registered_at::date BETWEEN $2::date AND $3::date
       GROUP BY 1
       ORDER BY count DESC`,
      [airlineId, fromDateString, toDateString]
    );

    const typeDistribution = typeResult.rows.map((row: any) => ({
      name: row.action_type || '미정의',
      count: row.count,
      percentage: total > 0 ? Math.round((row.count / Math.max(total, 1)) * 100) : 0,
    }));

    const monthlyResult = await query(
      `SELECT TO_CHAR(registered_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
       FROM actions
       WHERE airline_id = $1
         AND registered_at::date BETWEEN $2::date AND $3::date
       GROUP BY month
       ORDER BY month DESC
       LIMIT 6`,
      [airlineId, fromDateString, toDateString]
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
      filters: {
        dateFrom: fromDateString,
        dateTo: toDateString,
      },
    });
  } catch (error) {
    console.error('조치 통계 조회 오류:', error);
    return NextResponse.json(
      { error: '조치 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
