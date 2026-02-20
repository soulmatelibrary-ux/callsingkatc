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
 * 항공사의 조치 등록 (관리자만)
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

    // 필터 파라미터
    const status = request.nextUrl.searchParams.get('status');
    const search = request.nextUrl.searchParams.get('search');
    const dateFrom = request.nextUrl.searchParams.get('dateFrom');
    const dateTo = request.nextUrl.searchParams.get('dateTo');
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // 기본 쿼리 (모든 호출부호와 그들의 조치 이력을 조회)
    let sql = `
      SELECT
        a.id, a.airline_id, a.callsign_id, a.action_type, a.description,
        a.manager_name, a.manager_email, a.responsible_staff, a.planned_due_date,
        a.status, a.result_detail, a.completed_at,
        a.registered_by, a.registered_at, a.updated_at,
        a.reviewed_by, a.reviewed_at, a.review_comment,
        al.code as airline_code, al.name_ko as airline_name_ko,
        cs.id as cs_id, cs.callsign_pair, cs.my_callsign, cs.other_callsign, cs.risk_level,
        cs.occurrence_count, cs.error_type, cs.sub_error, cs.similarity
      FROM callsigns cs
      LEFT JOIN actions a ON cs.id = a.callsign_id
      LEFT JOIN airlines al ON a.airline_id = al.id
      WHERE cs.airline_id = $1
    `;
    const queryParams: any[] = [airlineId];

    // 필터 조건
    if (status && ['pending', 'in_progress', 'completed'].includes(status)) {
      sql += ` AND a.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }

    // 검색 조건 (유사호출부호, 조치유형, 담당자)
    if (search && search.trim()) {
      sql += ` AND (
        cs.callsign_pair ILIKE $${queryParams.length + 1}
        OR a.action_type ILIKE $${queryParams.length + 1}
        OR a.manager_name ILIKE $${queryParams.length + 1}
      )`;
      queryParams.push(`%${search.trim()}%`);
      queryParams.push(`%${search.trim()}%`);
      queryParams.push(`%${search.trim()}%`);
    }

    // 날짜 필터 조건
    if (dateFrom) {
      sql += ` AND a.registered_at::date >= $${queryParams.length + 1}::date`;
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      sql += ` AND a.registered_at::date <= $${queryParams.length + 1}::date`;
      queryParams.push(dateTo);
    }

    // 페이지네이션
    sql += ` ORDER BY a.registered_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit);
    queryParams.push(offset);

    // 데이터 조회
    const result = await query(sql, queryParams);

    // 전체 개수 조회 (각 조치 행을 개별 계산)
    let countSql = `
      SELECT COUNT(*) as total FROM (
        SELECT a.id FROM callsigns cs
        LEFT JOIN actions a ON cs.id = a.callsign_id
        WHERE cs.airline_id = $1
      ) as t
    `;
    const countParams: any[] = [airlineId];

    if (status && ['pending', 'in_progress', 'completed'].includes(status)) {
      countSql += ` AND a.status = $${countParams.length + 1}`;
      countParams.push(status);
    }

    if (search && search.trim()) {
      countSql += ` AND (
        cs.callsign_pair ILIKE $${countParams.length + 1}
        OR a.action_type ILIKE $${countParams.length + 1}
        OR a.manager_name ILIKE $${countParams.length + 1}
      )`;
      countParams.push(`%${search.trim()}%`);
      countParams.push(`%${search.trim()}%`);
      countParams.push(`%${search.trim()}%`);
    }

    // 날짜 필터 조건
    if (dateFrom) {
      countSql += ` AND a.registered_at::date >= $${countParams.length + 1}::date`;
      countParams.push(dateFrom);
    }

    if (dateTo) {
      countSql += ` AND a.registered_at::date <= $${countParams.length + 1}::date`;
      countParams.push(dateTo);
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total, 10);

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
          callsign_pair: row.callsign_pair,
          my_callsign: row.my_callsign,
          other_callsign: row.other_callsign,
          risk_level: row.risk_level,
          occurrence_count: row.occurrence_count,
          error_type: row.error_type,
          sub_error: row.sub_error,
          similarity: row.similarity,
        } : null,
        action_type: row.action_type,
        description: row.description,
        manager_name: row.manager_name,
        manager_email: row.manager_email,
        responsible_staff: row.responsible_staff,
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
        // camelCase 별칭
        airlineId: row.airline_id,
        callsignId: row.callsign_id || row.cs_id,
        actionType: row.action_type,
        managerName: row.manager_name,
        managerEmail: row.manager_email,
        responsibleStaff: row.responsible_staff,
        plannedDueDate: row.planned_due_date,
        resultDetail: row.result_detail,
        completedAt: row.completed_at,
        registeredBy: row.registered_by,
        registeredAt: row.registered_at,
        updatedAt: row.updated_at,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        reviewComment: row.review_comment,
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

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근 가능합니다.' },
        { status: 403 }
      );
    }

    // 요청 본문
    const {
      callsignId,
      actionType,
      description,
      managerName,
      managerEmail,
      responsibleStaff,
      plannedDueDate,
    } = await request.json();

    // 필수 필드 검증
    if (!callsignId || !actionType) {
      return NextResponse.json(
        { error: '호출부호와 조치 유형은 필수입니다.' },
        { status: 400 }
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

    // 호출부호 존재 및 항공사 일치 확인
    const callsignCheck = await query(
      'SELECT id FROM callsigns WHERE id = $1 AND airline_id = $2',
      [callsignId, airlineId]
    );

    if (callsignCheck.rows.length === 0) {
      return NextResponse.json(
        { error: '호출부호를 찾을 수 없거나 항공사와 일치하지 않습니다.' },
        { status: 404 }
      );
    }

    // 조치 생성 (트랜잭션)
    const result = await transaction(async (trx) => {
      return trx(
        `INSERT INTO actions (
          airline_id, callsign_id, action_type, description,
          manager_name, manager_email, responsible_staff, planned_due_date,
          status, registered_by, registered_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          airlineId,
          callsignId,
          actionType,
          description || null,
          managerName || null,
          managerEmail || null,
          responsibleStaff || null,
          plannedDueDate || null,
          'pending',
          payload.userId, // 현재 관리자 ID
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '조치 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    const action = result.rows[0];

    return NextResponse.json(
      {
        id: action.id,
        airline_id: action.airline_id,
        callsign_id: action.callsign_id,
        action_type: action.action_type,
        description: action.description,
        manager_name: action.manager_name,
        manager_email: action.manager_email,
        responsible_staff: action.responsible_staff,
        planned_due_date: action.planned_due_date,
        status: action.status,
        registered_by: action.registered_by,
        registered_at: action.registered_at,
        updated_at: action.updated_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('조치 생성 오류:', error);
    return NextResponse.json(
      { error: '조치 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
