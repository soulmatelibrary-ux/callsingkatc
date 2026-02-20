/**
 * GET /api/actions/[id]
 * 조치 상세 조회
 *
 * PATCH /api/actions/[id]
 * 조치 상태 업데이트 (인증된 사용자)
 *
 * DELETE /api/actions/[id]
 * 조치 삭제 (관리자만)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query, transaction } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

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

    // 조치 조회
    const result = await query(
      `SELECT
        a.id, a.airline_id, a.callsign_id, a.action_type, a.description,
        a.manager_name, a.planned_due_date,
        a.status, a.result_detail, a.completed_at,
        a.registered_by, a.registered_at, a.updated_at,
        a.reviewed_by, a.reviewed_at, a.review_comment,
        al.code as airline_code, al.name_ko as airline_name_ko, al.name_en as airline_name_en,
        cs.callsign_pair, cs.my_callsign, cs.other_callsign, cs.risk_level, cs.similarity,
        cs.error_type, cs.sub_error, cs.occurrence_count
      FROM actions a
      LEFT JOIN airlines al ON a.airline_id = al.id
      LEFT JOIN callsigns cs ON a.callsign_id = cs.id
      WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '조치를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const action = result.rows[0];

    return NextResponse.json({
      id: action.id,
      airline_id: action.airline_id,
      airline: action.airline_code ? {
        id: action.airline_id,
        code: action.airline_code,
        name_ko: action.airline_name_ko,
        name_en: action.airline_name_en,
      } : null,
      callsign_id: action.callsign_id,
      callsign: action.callsign_pair ? {
        callsign_pair: action.callsign_pair,
        my_callsign: action.my_callsign,
        other_callsign: action.other_callsign,
        risk_level: action.risk_level,
        similarity: action.similarity,
        error_type: action.error_type,
        sub_error: action.sub_error,
        occurrence_count: action.occurrence_count,
      } : null,
      action_type: action.action_type,
      description: action.description,
      manager_name: action.manager_name,
      planned_due_date: action.planned_due_date,
      status: action.status,
      result_detail: action.result_detail,
      completed_at: action.completed_at,
      registered_by: action.registered_by,
      registered_at: action.registered_at,
      updated_at: action.updated_at,
      reviewed_by: action.reviewed_by,
      reviewed_at: action.reviewed_at,
      review_comment: action.review_comment,
    });
  } catch (error) {
    console.error('조치 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '조치 상세 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

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

    // 요청 본문
    const {
      status,
      description,
      manager_name,
      planned_due_date,
      result_detail,
      completed_at,
      review_comment,
    } = await request.json();

    // 상태 검증
    if (status && !['pending', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }

    // 기존 조치 확인
    const existingAction = await query(
      'SELECT id, status FROM actions WHERE id = $1',
      [id]
    );

    if (existingAction.rows.length === 0) {
      return NextResponse.json(
        { error: '조치를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 업데이트 필드 구성
    let sql = 'UPDATE actions SET ';
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (manager_name !== undefined) {
      fields.push(`manager_name = $${paramIndex++}`);
      values.push(manager_name);
    }
    if (planned_due_date !== undefined) {
      fields.push(`planned_due_date = $${paramIndex++}`);
      values.push(planned_due_date);
    }
    if (result_detail !== undefined) {
      fields.push(`result_detail = $${paramIndex++}`);
      values.push(result_detail);
    }
    if (completed_at !== undefined) {
      fields.push(`completed_at = $${paramIndex++}`);
      values.push(completed_at);
    }
    if (review_comment !== undefined) {
      fields.push(`review_comment = $${paramIndex++}`);
      values.push(review_comment);
    }

    // 검토 정보 추가
    fields.push(`reviewed_by = $${paramIndex++}`);
    values.push(payload.userId); // 현재 관리자 ID

    fields.push(`reviewed_at = $${paramIndex++}`);
    values.push(new Date().toISOString());

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date().toISOString());

    sql += fields.join(', ') + ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);

    const result = await transaction(async (trx) => {
      return trx(sql, values);
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '조치 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    const updatedAction = result.rows[0];

    return NextResponse.json({
      id: updatedAction.id,
      airline_id: updatedAction.airline_id,
      callsign_id: updatedAction.callsign_id,
      action_type: updatedAction.action_type,
      description: updatedAction.description,
      manager_name: updatedAction.manager_name,
      planned_due_date: updatedAction.planned_due_date,
      status: updatedAction.status,
      result_detail: updatedAction.result_detail,
      completed_at: updatedAction.completed_at,
      registered_by: updatedAction.registered_by,
      registered_at: updatedAction.registered_at,
      updated_at: updatedAction.updated_at,
      reviewed_by: updatedAction.reviewed_by,
      reviewed_at: updatedAction.reviewed_at,
      review_comment: updatedAction.review_comment,
    });
  } catch (error) {
    console.error('조치 업데이트 오류:', error);
    return NextResponse.json(
      { error: '조치 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

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

    // 조치 존재 확인
    const existingAction = await query(
      'SELECT id FROM actions WHERE id = $1',
      [id]
    );

    if (existingAction.rows.length === 0) {
      return NextResponse.json(
        { error: '조치를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 삭제 (on_delete cascade는 자동으로 action_history도 삭제)
    await transaction(async (trx) => {
      return trx('DELETE FROM actions WHERE id = $1', [id]);
    });

    return NextResponse.json(
      { message: '조치가 삭제되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('조치 삭제 오류:', error);
    return NextResponse.json(
      { error: '조치 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
