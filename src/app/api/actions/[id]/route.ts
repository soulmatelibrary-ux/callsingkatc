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
      WHERE a.id = ?`,
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
      action_type,
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
      'SELECT id, status, callsign_id FROM actions WHERE id = ?',
      [id]
    );

    if (existingAction.rows.length === 0) {
      return NextResponse.json(
        { error: '조치를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 상태 로직: in_progress는 action row 삭제 + callsigns.status 'in_progress'로 복원
    if (status === 'in_progress') {
      // in_progress = 항공사 미조치 상태 = action row 삭제 + callsign 상태 복원
      const deletedAction = await query(
        'SELECT id, callsign_id FROM actions WHERE id = ?',
        [id]
      );

      if (deletedAction.rows.length === 0) {
        return NextResponse.json(
          { error: '조치를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const callsignId = deletedAction.rows[0].callsign_id;

      // 트랜잭션: action 삭제 + callsign 상태 복원
      await transaction(async (trx) => {
        // 1. action 행 삭제
        await trx('DELETE FROM actions WHERE id = ?', [id]);

        // 2. callsign 상태를 'in_progress'로 변경 (항공사가 다시 조치하도록)
        await trx('UPDATE callsigns SET status = ? WHERE id = ?', ['in_progress', callsignId]);
      });

      // 삭제된 action 데이터 반환 (mutation 성공 처리)
      return NextResponse.json(deletedAction.rows[0], { status: 200 });
    }

    // 업데이트 필드 구성 (completed 또는 다른 상태 업데이트)
    let sql = 'UPDATE actions SET ';
    const fields: string[] = [];
    const values: any[] = [];

    // status 필드 업데이트 (필수)
    if (status !== undefined) {
      fields.push(`status = ?`);
      values.push(status);
    }

    if (action_type !== undefined) {
      fields.push(`action_type = ?`);
      values.push(action_type);
    }
    if (description !== undefined) {
      fields.push(`description = ?`);
      values.push(description);
    }
    if (manager_name !== undefined) {
      fields.push(`manager_name = ?`);
      values.push(manager_name);
    }
    if (planned_due_date !== undefined) {
      fields.push(`planned_due_date = ?`);
      values.push(planned_due_date);
    }
    if (result_detail !== undefined) {
      fields.push(`result_detail = ?`);
      values.push(result_detail);
    }
    if (completed_at !== undefined) {
      fields.push(`completed_at = ?`);
      values.push(completed_at);
    }
    if (review_comment !== undefined) {
      fields.push(`review_comment = ?`);
      values.push(review_comment);
    }

    // 검토 정보 추가
    fields.push(`reviewed_by = ?`);
    values.push(payload.userId); // 현재 관리자 ID

    fields.push(`reviewed_at = ?`);
    values.push(new Date().toISOString());

    fields.push(`updated_at = ?`);
    values.push(new Date().toISOString());

    sql += fields.join(', ') + ` WHERE id = ?`;
    values.push(id);

    // 트랜잭션: action 업데이트 + callsigns 상태 동기화
    const callsignId = existingAction.rows[0].callsign_id;

    const result = await transaction(async (trx) => {
      // 1. action 업데이트
      const actionResult = await trx(sql, values);

      if (actionResult.changes > 0) {
        // 2. 업데이트된 action 조회 (응답용)
        const updated = await trx('SELECT * FROM actions WHERE id = ?', [id]);
        if (updated.rows.length > 0) {
          const newStatus = updated.rows[0].status;
          // 3. callsigns 상태 동기화: action의 status와 일치하게
          await trx('UPDATE callsigns SET status = ? WHERE id = ?', [newStatus, callsignId]);
        }
        return updated;
      }

      return { rows: [], changes: 0 };
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
      callsignId: updatedAction.callsign_id,
      actionType: updatedAction.action_type,
      managerName: updatedAction.manager_name,
      plannedDueDate: updatedAction.planned_due_date,
      resultDetail: updatedAction.result_detail,
      completedAt: updatedAction.completed_at,
      registeredBy: updatedAction.registered_by,
      registeredAt: updatedAction.registered_at,
      updatedAt: updatedAction.updated_at,
      reviewedBy: updatedAction.reviewed_by,
      reviewedAt: updatedAction.reviewed_at,
      reviewComment: updatedAction.review_comment,
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
      'SELECT id FROM actions WHERE id = ?',
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
      return trx('DELETE FROM actions WHERE id = ?', [id]);
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
