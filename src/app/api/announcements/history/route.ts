/**
 * GET /api/announcements/history
 * 공지사항 이력 조회 (사용자의 항공사별)
 *
 * 쿼리 파라미터:
 *   - level: warning|info|success (선택사항)
 *   - status: active|expired|all (선택사항)
 *   - dateFrom: YYYY-MM-DD (선택사항)
 *   - dateTo: YYYY-MM-DD (선택사항)
 *   - page: 페이지 번호 (기본값: 1)
 *   - limit: 페이지 크기 (기본값: 20, 최대: 100)
 *
 * 응답:
 *   { announcements: [...], total: number, page: number, limit: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    // 2. 사용자 정보 조회
    const userResult = await query(
      `SELECT id, airline_id FROM users WHERE id = $1`,
      [payload.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // 3. 필터 파라미터
    const level = request.nextUrl.searchParams.get('level');
    const status = request.nextUrl.searchParams.get('status') || 'all';
    const dateFrom = request.nextUrl.searchParams.get('dateFrom');
    const dateTo = request.nextUrl.searchParams.get('dateTo');
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // 4. 기본 쿼리 구성
    let sql = `
      SELECT
        a.id, a.title, a.content, a.level,
        a.start_date as "startDate", a.end_date as "endDate",
        a.is_active as "isActive",
        a.created_at as "createdAt",
        CASE
          WHEN a.start_date <= NOW() AND a.end_date >= NOW() THEN 'active'
          ELSE 'expired'
        END as status,
        COALESCE(av.id IS NOT NULL, false) as "isViewed"
      FROM announcements a
      LEFT JOIN announcement_views av
        ON a.id = av.announcement_id AND av.user_id = $1
      WHERE (
        a.target_airlines IS NULL
        OR $2 = ANY(string_to_array(a.target_airlines, ','))
      )
    `;

    const queryParams: any[] = [user.id, user.airline_id];

    // 5. 필터 적용
    if (level && ['warning', 'info', 'success'].includes(level)) {
      sql += ` AND a.level = $${queryParams.length + 1}`;
      queryParams.push(level);
    }

    // 상태 필터
    if (status !== 'all') {
      if (status === 'active') {
        sql += ` AND a.start_date <= NOW() AND a.end_date >= NOW()`;
      } else if (status === 'expired') {
        sql += ` AND (a.start_date > NOW() OR a.end_date < NOW())`;
      }
    }

    // 날짜 범위 필터
    if (dateFrom) {
      sql += ` AND a.start_date >= $${queryParams.length + 1}::DATE`;
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      sql += ` AND a.start_date <= $${queryParams.length + 1}::DATE + INTERVAL '1 day'`;
      queryParams.push(dateTo);
    }

    // 6. 페이지네이션
    const countResult = await query(
      sql.replace(/SELECT[\s\S]*FROM/, 'SELECT COUNT(*) as count FROM'),
      queryParams
    );
    const total = countResult.rows[0].count;

    sql += ` ORDER BY a.start_date DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await query(sql, queryParams);

    return NextResponse.json({
      announcements: result.rows,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('[GET /api/announcements/history] Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
