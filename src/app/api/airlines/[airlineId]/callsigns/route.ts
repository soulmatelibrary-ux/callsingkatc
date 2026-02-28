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

    // 필터 파라미터
    const riskLevel = request.nextUrl.searchParams.get('riskLevel');
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10));
    const limit = Math.min(1000, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // 항공사 코드 조회 (존재 여부 확인 통합)
    const airlineCodeResult = await query(
      'SELECT id, code FROM airlines WHERE id = ?',
      [airlineId]
    );

    if (airlineCodeResult.rows.length === 0) {
      return NextResponse.json(
        { error: '항공사를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const airlineCode = airlineCodeResult.rows[0].code;

    // 유효한 riskLevel 값 검증
    const validRiskLevels = ['매우높음', '높음', '낮음'];
    const filteredRiskLevel = riskLevel && validRiskLevels.includes(riskLevel) ? riskLevel : null;

    // 📌 진행 중인 호출부호만 조회 (status = 'in_progress')
    // callsigns.status는 actions 상태와 동기화됨:
    // - 초기값: 'in_progress'
    // - 조치 완료: 'completed'로 자동 업데이트

    // 동적 쿼리 파라미터 구성
    const queryParams: (string | number)[] = [airlineCode, airlineCode];
    let riskLevelCondition = '';

    if (filteredRiskLevel) {
      queryParams.push(filteredRiskLevel);
      riskLevelCondition = `AND risk_level = ?`;
    }

    // LIMIT과 OFFSET 추가
    queryParams.push(limit, offset);

    const simpleResult = await query(
      `SELECT id, airline_id, airline_code, callsign_pair, my_callsign, other_callsign,
              other_airline_code, error_type, sub_error, risk_level, similarity,
              file_upload_id, uploaded_at, occurrence_count, first_occurred_at, last_occurred_at,
              status, created_at, updated_at
       FROM callsigns
       WHERE (airline_code = ? OR other_airline_code = ?)
         AND status = 'in_progress'
         ${riskLevelCondition}
       ORDER BY
         CASE
           WHEN risk_level = '매우높음' THEN 3
           WHEN risk_level = '높음' THEN 2
           WHEN risk_level = '낮음' THEN 1
           ELSE 0
         END DESC,
         occurrence_count DESC,
         last_occurred_at DESC
       LIMIT ? OFFSET ?`,
      queryParams
    );

    const result = simpleResult;

    // 전체 개수 조회 (진행 중인 호출부호만 카운트, riskLevel 필터 적용)
    const countParams: (string | number)[] = [airlineCode, airlineCode];
    let countRiskCondition = '';
    if (filteredRiskLevel) {
      countParams.push(filteredRiskLevel);
      countRiskCondition = `AND risk_level = ?`;
    }

    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM callsigns
       WHERE (airline_code = ? OR other_airline_code = ?)
         AND status = 'in_progress'
         ${countRiskCondition}`,
      countParams
    );
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
        status: callsign.status,
        occurrence_count: callsign.occurrence_count,
        first_occurred_at: callsign.first_occurred_at,
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
        firstOccurredAt: callsign.first_occurred_at,
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
