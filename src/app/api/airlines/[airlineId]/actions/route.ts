/**
 * GET /api/airlines/[airlineId]/actions
 * 항공사별 조치 목록 조회 (인증 사용자만)
 *
 * 쿼리 파라미터:
 *   - status: pending|in_progress|completed
 *   - search: 검색어 (유사호출부호, 조치유형, 담당자)
 *   - dateFrom: 시작 날짜 (YYYY-MM-DD)
 *   - dateTo: 종료 날짜 (YYYY-MM-DD)
 *   - page: 페이지 번호 (기본값: 1)
 *   - limit: 페이지 크기 (기본값: 20, 최대: 100)
 *
 * POST /api/airlines/[airlineId]/actions
 * 항공사의 조치 등록 (인증된 사용자)
 *
 * 요청 본문:
 * {
 *   callsignId: string (필수)
 *   actionType: string (필수) - "편명 변경", "브리핑 시행" 등
 *   description?: string
 *   managerName?: string
 *   managerEmail?: string
 *   plannedDueDate?: string (ISO 8601)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query, transaction } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ airlineId: string }> }
) {
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

    const airlineId = (await params).airlineId;

    // 권한 검증: 관리자이거나 해당 항공사 소속 사용자만 접근 (W-7 FIX)
    if (payload.role !== 'admin' && payload.airlineId !== airlineId) {
      return NextResponse.json(
        { error: '해당 항공사의 조치 목록을 조회할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 필터 파라미터
    const status = request.nextUrl.searchParams.get('status');
    const search = request.nextUrl.searchParams.get('search');
    const dateFrom = request.nextUrl.searchParams.get('dateFrom');
    const dateTo = request.nextUrl.searchParams.get('dateTo');
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // 가상 항목(조치 미등록)은 포함 - callsigns만 있고 actions 없는 항목
    // "전체" 또는 "진행중" 필터에서 포함 (완료 필터에서는 제외)
    const allowVirtualEntries = !status || status === 'in_progress';

    const actionConditions: string[] = ['a.airline_id = ?', 'COALESCE(a.is_cancelled, 0) = 0'];
    const actionParams: any[] = [airlineId];

    if (status && ['pending', 'in_progress', 'completed'].includes(status)) {
      actionConditions.push('a.status = ?');
      actionParams.push(status);
    }

    if (search && search.trim()) {
      const searchValue = `%${search}%`;
      actionConditions.push(`(
        cs.callsign_pair LIKE ?
        OR a.action_type LIKE ?
        OR a.manager_name LIKE ?
      )`);
      actionParams.push(searchValue, searchValue, searchValue);
    }

    if (dateFrom) {
      actionConditions.push('a.registered_at >= ?');
      actionParams.push(dateFrom);
    }

    if (dateTo) {
      actionConditions.push('a.registered_at <= ?');
      actionParams.push(dateTo);
    }

    const actionSql = `
      SELECT
        a.id, a.airline_id, a.callsign_id, a.action_type, a.description,
        a.manager_name, a.manager_email, a.planned_due_date,
        a.status,
        a.result_detail, a.completed_at,
        a.registered_by, a.registered_at, a.updated_at,
        a.reviewed_by, a.reviewed_at, a.review_comment,
        al.id as airline_id_ref, al.code as airline_code, al.name_ko as airline_name_ko,
        cs.id as cs_id,
        cs.callsign_pair,
        cs.my_callsign,
        cs.other_callsign,
        cs.airline_code as cs_airline_code,
        cs.other_airline_code,
        cs.risk_level,
        cs.occurrence_count,
        cs.error_type,
        cs.sub_error,
        cs.similarity,
        cs.created_at as callsign_created_at,
        cs.last_occurred_at,
        0 as is_virtual
      FROM actions a
      LEFT JOIN airlines al ON a.airline_id = al.id
      LEFT JOIN callsigns cs ON a.callsign_id = cs.id
      WHERE ${actionConditions.join(' AND ')}
    `;

    let unionSql = actionSql;
    let unionParams = [...actionParams];

    if (allowVirtualEntries) {
      const virtualConditions: string[] = ['cs.airline_id = ?', "cs.status = 'in_progress'"];
      const virtualParams: any[] = [airlineId];

      if (search && search.trim()) {
        const searchValue = `%${search}%`;
        virtualConditions.push(`(
          cs.callsign_pair LIKE ?
          OR '조치 등록 필요' LIKE ?
          OR '' LIKE ?
        )`);
        virtualParams.push(searchValue, searchValue, searchValue);
      }

      if (dateFrom) {
        virtualConditions.push('cs.last_occurred_at >= ?');
        virtualParams.push(dateFrom);
      }

      if (dateTo) {
        virtualConditions.push('cs.last_occurred_at <= ?');
        virtualParams.push(dateTo);
      }

      const virtualSql = `
        SELECT
          ('virtual-' || cs.id) as id,
          cs.airline_id,
          cs.id as callsign_id,
          '조치 등록 필요' as action_type,
          NULL as description,
          NULL as manager_name,
          NULL as manager_email,
          NULL as planned_due_date,
          'in_progress' as status,
          NULL as result_detail,
          NULL as completed_at,
          '' as registered_by,
          cs.created_at as registered_at,
          cs.updated_at as updated_at,
          NULL as reviewed_by,
          NULL as reviewed_at,
          NULL as review_comment,
          al.id as airline_id_ref,
          al.code as airline_code,
          al.name_ko as airline_name_ko,
          cs.id as cs_id,
          cs.callsign_pair,
          cs.my_callsign,
          cs.other_callsign,
          cs.airline_code as cs_airline_code,
          cs.other_airline_code,
          cs.risk_level,
          cs.occurrence_count,
          cs.error_type,
          cs.sub_error,
          cs.similarity,
          cs.created_at as callsign_created_at,
          cs.last_occurred_at,
          1 as is_virtual
        FROM callsigns cs
        JOIN airlines al ON cs.airline_id = al.id
        LEFT JOIN (
          SELECT DISTINCT callsign_id, airline_id
          FROM actions
          WHERE status IN ('pending', 'in_progress') AND COALESCE(is_cancelled, 0) = 0
        ) active_actions
          ON active_actions.callsign_id = cs.id
          AND active_actions.airline_id = cs.airline_id
        WHERE ${virtualConditions.join(' AND ')}
          AND active_actions.callsign_id IS NULL
      `;

      unionSql = `${unionSql} UNION ALL ${virtualSql}`;
      unionParams = [...unionParams, ...virtualParams];
    }

    const finalSql = `${unionSql} ORDER BY registered_at DESC LIMIT ? OFFSET ?`;
    const finalParams = [...unionParams, limit, offset];
    const result = await query(finalSql, finalParams);

    const countSql = `SELECT COUNT(*) as total FROM (${unionSql}) as combined`;
    const countResult = await query(countSql, unionParams);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    return NextResponse.json({
      data: result.rows.map((row: any) => ({
        // 조치 정보 (있는 경우)
        id: row.id,
        airline_id: row.airline_id,
        airline: row.airline_code ? {
          id: row.airline_id,
          code: row.airline_code,
          name_ko: row.airline_name_ko,
        } : null,
        callsign_id: row.callsign_id || row.cs_id,
        callsign: row.callsign_pair ? {
            id: row.cs_id,
            callsign_pair: row.callsign_pair,
            my_callsign: row.my_callsign,
            other_callsign: row.other_callsign,
            airline_code: row.cs_airline_code,
            other_airline_code: row.other_airline_code,
            risk_level: row.risk_level,
            occurrence_count: row.occurrence_count,
            error_type: row.error_type,
            sub_error: row.sub_error,
            similarity: row.similarity,
            created_at: row.callsign_created_at,
            last_occurred_at: row.last_occurred_at,
          } : null,
        action_type: row.action_type,
        description: row.description,
        manager_name: row.manager_name,
        planned_due_date: row.planned_due_date,
        status: row.status,
        result_detail: row.result_detail,
        completed_at: row.completed_at,
        registered_by: row.registered_by,
        registered_at: row.registered_at,
        updated_at: row.updated_at,
        reviewed_by: row.reviewed_by,
        reviewed_at: row.reviewed_at,
        review_comment: row.review_comment,
        is_virtual: Boolean(row.is_virtual),
        // camelCase 별칭
        airlineId: row.airline_id,
        callsignId: row.callsign_id || row.cs_id,
        actionType: row.action_type,
        managerName: row.manager_name,
        plannedDueDate: row.planned_due_date,
        resultDetail: row.result_detail,
        completedAt: row.completed_at,
        registeredBy: row.registered_by,
        registeredAt: row.registered_at,
        updatedAt: row.updated_at,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        reviewComment: row.review_comment,
        isVirtual: Boolean(row.is_virtual),
        airlineCode: row.cs_airline_code,
        otherAirlineCode: row.other_airline_code,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('항공사별 조치 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '항공사별 조치 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ airlineId: string }> }
) {
  try {
    const { airlineId } = await params;

    // 📌 DEBUG: POST 요청이 도달했는지 확인
    console.log('[POST /api/airlines/[airlineId]/actions] 요청 도달:', {
      airlineId,
      method: request.method,
      url: request.url,
    });

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

    // 인가 확인: 관리자이거나 해당 항공사 소속이어야 함
    if (payload.role !== 'admin' && payload.airlineId !== airlineId) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 국내 항공사 목록 조회 (W-5 FIX: 최종 상태 계산용)
    const domesticAirlinesResult = await query('SELECT code FROM airlines');
    const domesticAirlines = new Set(
      (domesticAirlinesResult.rows || []).map((a: any) => a.code)
    );

    // 요청 본문 (ActionModal에서 snake_case로 전송)
    const body = await request.json();
    const {
      callsign_id: callsignId,
      action_type: actionType,
      description,
      manager_name: managerName,
      planned_due_date: plannedDueDate,
      completed_at: completedAt,
      status: requestStatus,
    } = body;

    // 필수 필드 검증
    if (!callsignId || !actionType) {
      return NextResponse.json(
        { error: '호출부호와 조치 유형은 필수입니다.' },
        { status: 400 }
      );
    }

    // 항공사 존재 여부 및 코드 조회
    const airlineCheck = await query(
      'SELECT id, code FROM airlines WHERE id = ?',
      [airlineId]
    );

    if (airlineCheck.rows.length === 0) {
      return NextResponse.json(
        { error: '항공사를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const airlineCode = airlineCheck.rows[0].code;

    // 호출부호 존재 및 항공사 코드 일치 확인 + 상세 정보 조회
    // (내 항공사이거나 상대 항공사인 경우 모두 허용)
    const callsignCheck = await query(
      'SELECT id, airline_code, other_airline_code, my_action_status, other_action_status FROM callsigns WHERE id = ? AND (airline_code = ? OR other_airline_code = ?)',
      [callsignId, airlineCode, airlineCode]
    );

    if (callsignCheck.rows.length === 0) {
      return NextResponse.json(
        { error: '호출부호를 찾을 수 없거나 항공사와 일치하지 않습니다.' },
        { status: 404 }
      );
    }

    const callsignData = callsignCheck.rows[0];
    // 상대 항공사 코드 결정 (현재 항공사와 다른 쪽)
    const otherAirlineCode = callsignData.airline_code === airlineCode
      ? callsignData.other_airline_code
      : callsignData.airline_code;

    // 상대 항공사 ID 조회
    const otherAirlineResult = await query(
      'SELECT id FROM airlines WHERE code = ?',
      [otherAirlineCode]
    );

    let otherAirlineId: string | null = null;
    let otherActionStatus: string | null = null;

    if (otherAirlineResult.rows.length > 0) {
      otherAirlineId = otherAirlineResult.rows[0].id;

      // 상대 항공사의 현재 조치 상태 조회 (W-5 FIX)
      const otherActionCheck = await query(
        'SELECT status FROM actions WHERE callsign_id = ? AND airline_id = ? AND COALESCE(is_cancelled, 0) = 0 ORDER BY registered_at DESC LIMIT 1',
        [callsignId, otherAirlineId]
      );
      if (otherActionCheck.rows.length > 0) {
        otherActionStatus = otherActionCheck.rows[0].status;
      }
    }

    // completed 상태일 때만 completedAt 설정 (기본값: 현재 시각)
    const actionStatus = requestStatus || 'completed';
    const completedTimestamp = (actionStatus === 'completed' && !completedAt)
      ? new Date().toISOString()
      : completedAt || null;

    // Step 1: 기존 action 조회 (취소된 행도 포함하여 재조치 지원)
    // COALESCE(is_cancelled, 0)=0인 행 우선, 그 다음 is_cancelled=1 (취소된 행)을 조회
    const existingActionResult = await query(
      `SELECT id FROM actions WHERE airline_id = ? AND callsign_id = ?
       ORDER BY COALESCE(is_cancelled, 0) ASC, registered_at DESC LIMIT 1`,
      [airlineId, callsignId]
    );

    if (existingActionResult.rows.length === 0) {
      return NextResponse.json(
        { error: '등록할 조치를 찾을 수 없습니다. (호출부호가 등록되지 않았습니다.)' },
        { status: 404 }
      );
    }

    const existingActionId = existingActionResult.rows[0].id;

    // Step 2: 기존 action UPDATE (취소된 행도 복원 가능)
    await transaction(async (trx) => {
      // 1. action 업데이트 (상태, 조치 정보, 취소 플래그 복원)
      const nowIso = new Date().toISOString();
      await trx(
        `UPDATE actions SET
          action_type = ?,
          description = ?,
          manager_name = ?,
          planned_due_date = ?,
          completed_at = ?,
          status = ?,
          is_cancelled = 0,
          updated_at = ?
         WHERE id = ?`,
        [actionType, description || null, managerName || null, plannedDueDate || null, completedTimestamp, actionStatus, nowIso, existingActionId]
      );

      // 2. callsigns 테이블 업데이트
      // - my_action_status, other_action_status: 조치 상태 업데이트
      // - status: 호출부호 전체 처리 상태
      // (W-6 FIX: 같은 항공사는 양쪽 동시 업데이트, 외국항공사는 자동완료)

      const isMy = callsignData.airline_code === airlineCode;
      const isSameAirline = callsignData.airline_code === callsignData.other_airline_code;
      const isForeignAirline = !otherAirlineCode || !domesticAirlines.has(otherAirlineCode);

      let myStatus = isMy ? actionStatus : callsignData.my_action_status || 'no_action';
      let otherStatus = !isMy ? actionStatus : callsignData.other_action_status || 'no_action';

      // 같은 항공사: 한쪽이 완료되면 양쪽 모두 완료
      if (isSameAirline && actionStatus === 'completed') {
        myStatus = 'completed';
        otherStatus = 'completed';
      }

      // 외국항공사: 자사 조치 시 상대도 자동완료
      if (isForeignAirline && isMy && actionStatus === 'completed') {
        otherStatus = 'completed';
      }

      // 최종 callsigns 상태 계산
      const myCompleted = myStatus === 'completed';
      const otherCompleted = otherStatus === 'completed';
      let newCallsignStatus = 'in_progress';

      if (isSameAirline) {
        // 같은 항공사: 한쪽만 완료해도 완료
        newCallsignStatus = (myCompleted || otherCompleted) ? 'completed' : 'in_progress';
      } else if (isForeignAirline) {
        // 외국항공사: 자사만 완료하면 완료 (상대는 자동완료됨)
        newCallsignStatus = myCompleted ? 'completed' : 'in_progress';
      } else {
        // 국내 항공사 간: 양쪽 모두 완료해야 완료
        newCallsignStatus = (myCompleted && otherCompleted) ? 'completed' : 'in_progress';
      }

      await trx(
        `UPDATE callsigns SET status = ?, my_action_status = ?, other_action_status = ? WHERE id = ?`,
        [newCallsignStatus, myStatus, otherStatus, callsignId]
      );
    });

    // Step 3: 업데이트된 조치 조회
    const actionResult = await query(
      `SELECT
        id, airline_id, callsign_id, action_type, description,
        manager_name, planned_due_date, completed_at,
        status, registered_by, registered_at, updated_at
       FROM actions
       WHERE id = ?`,
      [existingActionId]
    );

    if (actionResult.rows.length === 0) {
      return NextResponse.json(
        { error: '조치 조회 실패' },
        { status: 500 }
      );
    }

    const action = actionResult.rows[0];

    return NextResponse.json(
      {
        id: action.id,
        airline_id: action.airline_id,
        callsign_id: action.callsign_id,
        action_type: action.action_type,
        description: action.description,
        manager_name: action.manager_name,
        planned_due_date: action.planned_due_date,
        completed_at: action.completed_at,
        status: action.status,
        registered_by: action.registered_by,
        registered_at: action.registered_at,
        updated_at: action.updated_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('조치 생성 오류:', error);
    // W-10 FIX: 500 에러에서 내부 상세 메시지 제거
    return NextResponse.json(
      { error: '조치 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
