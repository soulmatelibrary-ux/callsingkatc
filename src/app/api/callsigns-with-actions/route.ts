/**
 * GET /api/callsigns-with-actions
 * 관리자용: 호출부호와 양쪽 항공사의 조치 상태를 함께 조회
 *
 * 쿼리 파라미터:
 *   - riskLevel: 위험도 필터 (매우높음|높음|낮음)
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
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // 유효한 riskLevel 값 검증
    const validRiskLevels = ['매우높음', '높음', '낮음'];
    const filteredRiskLevel = riskLevel && validRiskLevels.includes(riskLevel) ? riskLevel : null;

    // 쿼리 파라미터 구성
    const queryParams: (string | number)[] = [];
    let riskLevelCondition = '';

    if (filteredRiskLevel) {
      queryParams.push(filteredRiskLevel);
      riskLevelCondition = `AND risk_level = ?`;
    }

    queryParams.push(limit, offset);

    // 호출부호 목록 조회
    const callsignsResult = await query(
      `SELECT id, airline_id, airline_code, callsign_pair, my_callsign, other_callsign,
              other_airline_code, error_type, sub_error, risk_level, similarity,
              occurrence_count, first_occurred_at, last_occurred_at,
              status, created_at, updated_at
       FROM callsigns
       WHERE status = 'in_progress'
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

    // 각 호출부호의 양쪽 항공사 조치 상태 조회
    const callsignIds = callsignsResult.rows.map((cs: any) => cs.id);
    let actionStatusMap: {
      [key: string]: {
        myAirlineId: string;
        myAirlineCode: string;
        myActionStatus: string;
        myActionType: string | null;
        otherAirlineCode: string;
        otherActionStatus: string;
        otherActionType: string | null;
      };
    } = {};

    if (callsignIds.length > 0) {
      const placeholders = callsignIds.map(() => '?').join(',');
      const actionsResult = await query(
        `SELECT a.callsign_id, a.airline_id, al.code, a.status, a.action_type
         FROM actions a
         LEFT JOIN airlines al ON a.airline_id = al.id
         WHERE a.callsign_id IN (${placeholders})
         ORDER BY a.registered_at DESC`,
        callsignIds
      );

      // 호출부호별 양쪽 항공사의 조치 상태 저장
      for (const action of actionsResult.rows) {
        const callsignId = action.callsign_id;
        if (!actionStatusMap[callsignId]) {
          actionStatusMap[callsignId] = {
            myAirlineId: '',
            myAirlineCode: '',
            myActionStatus: 'no_action',
            myActionType: null,
            otherAirlineCode: '',
            otherActionStatus: 'no_action',
            otherActionType: null,
          };
        }

        const callsign = callsignsResult.rows.find((cs: any) => cs.id === callsignId);
        if (!callsign) continue;

        // 자사 항공사 조치
        if (action.code === callsign.airline_code) {
          actionStatusMap[callsignId].myAirlineId = callsign.airline_id;
          actionStatusMap[callsignId].myAirlineCode = callsign.airline_code;
          actionStatusMap[callsignId].myActionStatus = action.status || 'no_action';
          actionStatusMap[callsignId].myActionType = action.action_type;
        }
        // 타사 항공사 조치
        else if (action.code === callsign.other_airline_code) {
          actionStatusMap[callsignId].otherAirlineCode = callsign.other_airline_code;
          actionStatusMap[callsignId].otherActionStatus = action.status || 'no_action';
          actionStatusMap[callsignId].otherActionType = action.action_type;
        }
      }

      // 기본값 설정 (조치 없는 항공사 정보 채우기)
      for (const callsign of callsignsResult.rows) {
        if (!actionStatusMap[callsign.id]) {
          actionStatusMap[callsign.id] = {
            myAirlineId: callsign.airline_id,
            myAirlineCode: callsign.airline_code,
            myActionStatus: 'no_action',
            myActionType: null,
            otherAirlineCode: callsign.other_airline_code,
            otherActionStatus: 'no_action',
            otherActionType: null,
          };
        } else {
          // 이미 조치가 있는 경우에도 항공사 정보 채우기
          if (!actionStatusMap[callsign.id].myAirlineId) {
            actionStatusMap[callsign.id].myAirlineId = callsign.airline_id;
            actionStatusMap[callsign.id].myAirlineCode = callsign.airline_code;
          }
          if (!actionStatusMap[callsign.id].otherAirlineCode) {
            actionStatusMap[callsign.id].otherAirlineCode = callsign.other_airline_code;
          }
        }
      }
    }

    // 전체 개수 조회
    const countParams: (string | number)[] = [];
    let countRiskCondition = '';
    if (filteredRiskLevel) {
      countParams.push(filteredRiskLevel);
      countRiskCondition = `AND risk_level = ?`;
    }

    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM callsigns
       WHERE status = 'in_progress'
         ${countRiskCondition}`,
      countParams
    );
    const total = parseInt(countResult.rows[0].total, 10);

    return NextResponse.json({
      data: callsignsResult.rows.map((callsign: any) => {
        const actionStatus = actionStatusMap[callsign.id] || {
          myAirlineId: callsign.airline_id,
          myAirlineCode: callsign.airline_code,
          myActionStatus: 'no_action',
          myActionType: null,
          otherAirlineCode: callsign.other_airline_code,
          otherActionStatus: 'no_action',
          otherActionType: null,
        };

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
          occurrence_count: callsign.occurrence_count,
          first_occurred_at: callsign.first_occurred_at,
          last_occurred_at: callsign.last_occurred_at,
          status: callsign.status,
          created_at: callsign.created_at,
          updated_at: callsign.updated_at,
          // 양쪽 항공사 조치 상태
          my_airline_id: actionStatus.myAirlineId,
          my_airline_code: actionStatus.myAirlineCode,
          my_action_status: actionStatus.myActionStatus,
          my_action_type: actionStatus.myActionType,
          other_action_status: actionStatus.otherActionStatus,
          other_action_type: actionStatus.otherActionType,
          // 전체 완료 여부 (양쪽 모두 completed)
          both_completed: actionStatus.myActionStatus === 'completed' && actionStatus.otherActionStatus === 'completed',
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
    console.error('호출부호 조치 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '호출부호 조치 상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
