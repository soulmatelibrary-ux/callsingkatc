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
    const requestedAirlineId = params.airlineId;

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

    // 토큰에서 항공사 ID 확인
    const tokenAirlineId = payload.airlineId;
    if (!tokenAirlineId) {
      return NextResponse.json(
        { error: '토큰에 항공사 정보가 없습니다.' },
        { status: 401 }
      );
    }

    // 요청한 항공사 ID가 로그인 사용자의 항공사 ID와 일치하는지 확인 (관리자는 제외)
    const isAdmin = payload.role === 'admin';
    if (!isAdmin && requestedAirlineId !== tokenAirlineId) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 필터 파라미터
    const riskLevel = request.nextUrl.searchParams.get('riskLevel');
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10));
    const limit = Math.min(1000, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // 항공사 코드 조회
    const airlineCodeResult = await query(
      'SELECT id, code FROM airlines WHERE id = ?',
      [requestedAirlineId]
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

    // 📌 해당 항공사의 호출부호만 조회 (airline_code = ?)
    // 예: ESR 사용자 → airline_code = 'ESR'인 항공사의 호출부호만
    // 관리자 → 요청한 항공사의 호출부호만

    const queryParams: (string | number)[] = [airlineCode];
    let riskLevelCondition = '';

    if (filteredRiskLevel) {
      queryParams.push(filteredRiskLevel);
      riskLevelCondition = `AND risk_level = ?`;
    }

    queryParams.push(limit, offset);

    const callsignsResult = await query(
      `SELECT id, airline_id, airline_code, callsign_pair, my_callsign, other_callsign,
              other_airline_code, error_type, sub_error, risk_level, similarity,
              file_upload_id, uploaded_at, occurrence_count, first_occurred_at, last_occurred_at,
              status, created_at, updated_at
       FROM callsigns
       WHERE airline_code = ?
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

    // 각 호출부호에 대한 조치 상태 조회
    const callsignIds = callsignsResult.rows.map((cs: any) => cs.id);
    let actionStatusMap: { [key: string]: any } = {};

    if (callsignIds.length > 0) {
      const placeholders = callsignIds.map(() => '?').join(',');
      const actionsResult = await query(
        `SELECT id, callsign_id, status, action_type, completed_at
         FROM actions
         WHERE callsign_id IN (${placeholders})
           AND airline_id = ?
         ORDER BY registered_at DESC`,
        [...callsignIds, requestedAirlineId]
      );

      // 각 호출부호별 최신 조치 상태 저장 (중복 제거)
      for (const action of actionsResult.rows) {
        if (!actionStatusMap[action.callsign_id]) {
          actionStatusMap[action.callsign_id] = action;
        }
      }
    }

    // 전체 개수 조회
    const countParams: (string | number)[] = [airlineCode];
    let countRiskCondition = '';
    if (filteredRiskLevel) {
      countParams.push(filteredRiskLevel);
      countRiskCondition = `AND risk_level = ?`;
    }

    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM callsigns
       WHERE airline_code = ?
         AND status = 'in_progress'
         ${countRiskCondition}`,
      countParams
    );
    const total = parseInt(countResult.rows[0].total, 10);

    return NextResponse.json({
      data: callsignsResult.rows.map((callsign: any) => {
        const latestAction = actionStatusMap[callsign.id];
        return {
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
          // 조치 상태 추가
          action_id: latestAction?.id || null,
          action_status: latestAction?.status || 'no_action',
          action_type: latestAction?.action_type || null,
          action_completed_at: latestAction?.completed_at || null,
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
          actionId: latestAction?.id || null,
          actionStatus: latestAction?.status || 'no_action',
          actionType: latestAction?.action_type || null,
          actionCompletedAt: latestAction?.completed_at || null,
        };
      }),
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
