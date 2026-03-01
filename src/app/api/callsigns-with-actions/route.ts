/**
 * GET /api/callsigns-with-actions
 * 관리자용: 호출부호와 양쪽 항공사의 조치 상태를 함께 조회
 *
 * 쿼리 파라미터:
 *   - riskLevel: 위험도 필터 (매우높음|높음|낮음)
 *   - airlineId: 항공사 ID 필터 (UUID)
 *   - myActionStatus: 자사 조치 상태 필터 (completed|in_progress|pending|no_action)
 *   - actionType: 조치 유형 필터
 *   - completedDateFrom: 처리일자 시작 (YYYY-MM-DD)
 *   - completedDateTo: 처리일자 종료 (YYYY-MM-DD)
 *   - page: 페이지 번호 (기본값: 1)
 *   - limit: 페이지 크기 (기본값: 20, 최대: 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
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

    // 관리자 권한 확인
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 쿼리 파라미터
    const riskLevel = request.nextUrl.searchParams.get('riskLevel');
    const airlineId = request.nextUrl.searchParams.get('airlineId');
    const myActionStatus = request.nextUrl.searchParams.get('myActionStatus');
    const actionType = request.nextUrl.searchParams.get('actionType');
    const completedDateFrom = request.nextUrl.searchParams.get('completedDateFrom');
    const completedDateTo = request.nextUrl.searchParams.get('completedDateTo');
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)));

    // 입력값 검증
    const validRiskLevels = ['매우높음', '높음', '낮음'];
    const filteredRiskLevel = riskLevel && validRiskLevels.includes(riskLevel) ? riskLevel : null;

    // airlineId 형식 검증 (16진수 문자열, 하이픈 있거나 없음)
    const hexRegex = /^[0-9a-f]{32}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (airlineId && !hexRegex.test(airlineId)) {
      return NextResponse.json(
        { error: '유효하지 않은 항공사 ID입니다.' },
        { status: 400 }
      );
    }

    // myActionStatus 화이트리스트 검증
    const validActionStatuses = ['completed', 'in_progress', 'pending', 'no_action'];
    if (myActionStatus && !validActionStatuses.includes(myActionStatus)) {
      return NextResponse.json(
        { error: '유효하지 않은 조치 상태입니다.' },
        { status: 400 }
      );
    }

    // SQL 쿼리 파라미터 구성 (페이지네이션은 필터 후 Node.js에서 처리)
    const sqlParams: (string | number)[] = [];
    let conditions = '';

    if (filteredRiskLevel) {
      if (conditions) {
        conditions += ` AND risk_level = ?`;
      } else {
        conditions = `WHERE risk_level = ?`;
      }
      sqlParams.push(filteredRiskLevel);
    }

    if (airlineId) {
      if (conditions) {
        conditions += ` AND airline_id = ?`;
      } else {
        conditions = `WHERE airline_id = ?`;
      }
      sqlParams.push(airlineId);
    }

    // 호출부호 목록 조회 (callsigns + actions LEFT JOIN으로 조치 정보 포함)
    const callsignsResult = await query(
      `SELECT c.id, c.airline_id, c.airline_code, c.callsign_pair, c.my_callsign, c.other_callsign,
              c.other_airline_code, c.error_type, c.sub_error, c.risk_level, c.similarity,
              c.occurrence_count, c.first_occurred_at, c.last_occurred_at,
              c.file_upload_id, c.uploaded_at, c.status, c.created_at, c.updated_at,
              c.my_action_status, c.other_action_status,
              a.action_type, a.completed_at
       FROM callsigns c
       LEFT JOIN actions a ON c.id = a.callsign_id AND a.airline_id = c.airline_id
       ${conditions}
       ORDER BY
         CASE
           WHEN c.risk_level = '매우높음' THEN 3
           WHEN c.risk_level = '높음' THEN 2
           WHEN c.risk_level = '낮음' THEN 1
           ELSE 0
         END DESC,
         c.occurrence_count DESC,
         c.last_occurred_at DESC`,
      sqlParams
    );

    // myActionStatus 필터 적용 (callsigns.my_action_status 직접 사용)
    let filteredRows = callsignsResult.rows;

    if (myActionStatus) {
      filteredRows = filteredRows.filter((row: any) => {
        if (myActionStatus === 'in_progress') {
          // 진행중: 조치 없음 (no_action)
          return row.my_action_status === 'no_action';
        } else if (myActionStatus === 'completed') {
          // 완료: 조치 있음 (no_action 제외한 모든 상태)
          return row.my_action_status !== 'no_action';
        }
        return true;
      });
    }

    // actionType 필터 적용
    if (actionType) {
      filteredRows = filteredRows.filter((row: any) => row.action_type === actionType);
    }

    // 처리일자 범위 필터 적용
    if (completedDateFrom || completedDateTo) {
      filteredRows = filteredRows.filter((row: any) => {
        if (!row.completed_at) return false;
        const completedDate = row.completed_at.split('T')[0]; // YYYY-MM-DD 형식 추출
        if (completedDateFrom && completedDate < completedDateFrom) return false;
        if (completedDateTo && completedDate > completedDateTo) return false;
        return true;
      });
    }

    // summary 계산 (필터링 후)
    const summary = {
      total: filteredRows.length,
      completed: filteredRows.filter((r: any) => r.my_action_status !== 'no_action').length,
      in_progress: filteredRows.filter((r: any) => r.my_action_status === 'no_action').length,
    };

    // 페이지네이션 처리
    const total = filteredRows.length;
    const offset = (page - 1) * limit;
    const paginatedRows = filteredRows.slice(offset, offset + limit);

    // 전체 개수는 필터링 후 계산 (아래에서 처리)

    return NextResponse.json({
      data: paginatedRows.map((callsign: any) => ({
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
        first_occurred_at: callsign.first_occurred_at,
        last_occurred_at: callsign.last_occurred_at,
        file_upload_id: callsign.file_upload_id,
        uploaded_at: callsign.uploaded_at,
        status: callsign.status,
        created_at: callsign.created_at,
        updated_at: callsign.updated_at,
        // 양쪽 항공사 조치 상태 (callsigns 테이블에서 직접 조회)
        my_airline_id: callsign.airline_id,
        my_airline_code: callsign.airline_code,
        my_action_status: callsign.my_action_status || 'no_action',
        other_action_status: callsign.other_action_status || 'no_action',
        // 전체 완료 여부 (양쪽 모두 completed 아님 - 자사만 확인)
        both_completed: callsign.my_action_status === 'completed',
        // 조치 상세 정보
        action_type: callsign.action_type || null,
        completed_at: callsign.completed_at || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    });
  } catch (error) {
    console.error('호출부호 조치 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '호출부호 조치 상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
