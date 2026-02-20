/**
 * GET /api/airlines/[airlineId]/callsigns
 * 항공사별 유사호출부호 목록 조회
 *
 * 쿼리 파라미터:
 *   - riskLevel: 위험도 필터 (매우높음|높음|낮음)
 *   - page: 페이지 번호 (기본값: 1)
 *   - limit: 페이지 크기 (기본값: 20, 최대: 100)
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

    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    // 항공사 존재 여부 확인
    const airlineCheck = await query(
      'SELECT id FROM airlines WHERE id = $1',
      [airlineId]
    );

    if (airlineCheck.rows.length === 0) {
      return NextResponse.json(
        { error: '항공사를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 필터 파라미터
    const riskLevel = request.nextUrl.searchParams.get('riskLevel');
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // 쿼리 구성
    // 조치가 등록되지 않은 호출부호만 조회 (LEFT JOIN으로 조치 없는 것 필터링)
    // callsign_occurrences와 JOIN하여 발생 건수 및 최근 발생일 집계
    const sqlParams: any[] = [airlineId];

    // WHERE 조건 구성 (GROUP BY 전에)
    let whereCondition = 'WHERE c.airline_id = $1 AND a.id IS NULL';

    // 위험도 필터 (WHERE에 추가)
    if (riskLevel && ['매우높음', '높음', '낮음'].includes(riskLevel)) {
      whereCondition += ` AND c.risk_level = $${sqlParams.length + 1}`;
      sqlParams.push(riskLevel);
    }

    let sql = `
      SELECT
        c.id, c.airline_id, c.airline_code, c.callsign_pair, c.my_callsign, c.other_callsign,
        c.other_airline_code, c.error_type, c.sub_error, c.risk_level, c.similarity,
        c.file_upload_id, c.uploaded_at,
        c.created_at, c.updated_at,
        COUNT(co.id) AS occurrence_count,
        MAX(co.occurred_date) AS last_occurred_at
      FROM callsigns c
      LEFT JOIN actions a ON c.id = a.callsign_id
      LEFT JOIN callsign_occurrences co ON c.id = co.callsign_id
      ${whereCondition}
      GROUP BY c.id, c.airline_id, c.airline_code, c.callsign_pair, c.my_callsign, c.other_callsign,
               c.other_airline_code, c.error_type, c.sub_error, c.risk_level, c.similarity,
               c.file_upload_id, c.uploaded_at, c.created_at, c.updated_at
    `;

    // 정렬 및 페이지네이션 (발생건수 많은 순, 동일시 최근 발생일 순)
    sql += ` ORDER BY occurrence_count DESC, last_occurred_at DESC LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`;
    sqlParams.push(limit, offset);

    const result = await query(sql, sqlParams);

    // 전체 개수 조회 (고유 호출부호 쌍의 개수)
    const countSqlParams: any[] = [airlineId];

    let countWhereCondition = 'WHERE c.airline_id = $1 AND a.id IS NULL';

    if (riskLevel && ['매우높음', '높음', '낮음'].includes(riskLevel)) {
      countWhereCondition += ` AND c.risk_level = $${countSqlParams.length + 1}`;
      countSqlParams.push(riskLevel);
    }

    let countSql = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM callsigns c
      LEFT JOIN actions a ON c.id = a.callsign_id
      ${countWhereCondition}
    `;

    const countResult = await query(countSql, countSqlParams);
    const total = parseInt(countResult.rows[0].total, 10);

    return NextResponse.json({
      data: result.rows.map((callsign: any) => ({
        id: callsign.id,
        airline_id: callsign.airline_id,
        airline_code: callsign.airline_code,
        callsign_pair: callsign.callsign_pair,
        my_callsign: callsign.my_callsign,
        other_callsign: callsign.other_callsign,
        other_airline_code: callsign.other_airline_code,
        error_type: callsign.error_type,
        sub_error: callsign.sub_error,
        risk_level: callsign.risk_level,
        similarity: callsign.similarity,
        occurrence_count: callsign.occurrence_count,
        last_occurred_at: callsign.last_occurred_at,
        file_upload_id: callsign.file_upload_id,
        uploaded_at: callsign.uploaded_at,
        created_at: callsign.created_at,
        updated_at: callsign.updated_at,
        // camelCase 별칭
        airlineId: callsign.airline_id,
        airlineCode: callsign.airline_code,
        callsignPair: callsign.callsign_pair,
        myCallsign: callsign.my_callsign,
        otherCallsign: callsign.other_callsign,
        otherAirlineCode: callsign.other_airline_code,
        errorType: callsign.error_type,
        subError: callsign.sub_error,
        riskLevel: callsign.risk_level,
        occurrenceCount: callsign.occurrence_count,
        lastOccurredAt: callsign.last_occurred_at,
        fileUploadId: callsign.file_upload_id,
        uploadedAt: callsign.uploaded_at,
        createdAt: callsign.created_at,
        updatedAt: callsign.updated_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('항공사별 호출부호 조회 오류:', error);
    return NextResponse.json(
      { error: '항공사별 호출부호 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
