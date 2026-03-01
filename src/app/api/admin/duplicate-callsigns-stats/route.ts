import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/admin/duplicate-callsigns-stats
 *
 * 중복 유사호출부호 현황 조회
 * - 같은 조치 유형으로 여러 건을 처리한 항공사 통계
 * - 비용 절감 및 프로세스 개선 기회 발견
 *
 * 응답:
 * {
 *   data: [
 *     {
 *       airline_code: "KAL",
 *       airline_name_ko: "대한항공",
 *       action_type: "편명 변경",
 *       count: 10,
 *       opportunity_score: 85
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

    // 2️⃣ 중복 유사호출부호 현황 조회
    // 같은 조치 유형으로 3건 이상 처리한 항공사만 조회
    const duplicateStats = await query(
      `
      SELECT
        a.airline_id,
        al.code as airline_code,
        al.name_ko as airline_name_ko,
        a.action_type,
        COUNT(*) as count,
        ROUND(
          COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM actions
            WHERE airline_id = a.airline_id
          ),
          1
        ) as percentage,
        ROUND(
          COUNT(*) * 50.0 / 100.0,
          0
        )::int as opportunity_score
      FROM actions a
      LEFT JOIN airlines al ON a.airline_id = al.id
      WHERE a.action_type IS NOT NULL AND a.action_type != ''
      GROUP BY a.airline_id, al.code, al.name_ko, a.action_type
      HAVING COUNT(*) >= 3
      ORDER BY count DESC
      LIMIT 100
      `,
      []
    );

    // 3️⃣ 전체 중복 현황 요약
    const summaryStats = await query(
      `
      SELECT
        a.airline_id,
        al.code as airline_code,
        al.name_ko as airline_name_ko,
        COUNT(DISTINCT a.action_type) as unique_action_types,
        COUNT(*) as total_actions,
        COUNT(DISTINCT a.callsign_id) as unique_callsigns,
        ROUND(
          COUNT(*) * 100.0 / COUNT(DISTINCT a.callsign_id),
          1
        ) as duplicate_rate
      FROM actions a
      LEFT JOIN airlines al ON a.airline_id = al.id
      GROUP BY a.airline_id, al.code, al.name_ko
      HAVING COUNT(*) > 0
      ORDER BY duplicate_rate DESC
      `,
      []
    );

    return NextResponse.json({
      action_types: duplicateStats.map((row) => ({
        airline_code: row.airline_code,
        airline_name_ko: row.airline_name_ko,
        action_type: row.action_type,
        count: row.count,
        percentage: row.percentage || 0,
        opportunity_score: row.opportunity_score || 0,
      })),
      summary: summaryStats.map((row) => ({
        airline_code: row.airline_code,
        airline_name_ko: row.airline_name_ko,
        unique_action_types: row.unique_action_types,
        total_actions: row.total_actions,
        unique_callsigns: row.unique_callsigns,
        duplicate_rate: row.duplicate_rate || 0,
      })),
    });
  } catch (error) {
    console.error('[API] /api/admin/duplicate-callsigns-stats error:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
