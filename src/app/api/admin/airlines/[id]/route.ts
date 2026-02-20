/**
 * PATCH /api/admin/airlines/[id] - 항공사 수정 (관리자만)
 * DELETE /api/admin/airlines/[id] - 항공사 삭제 (관리자만)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query } from '@/lib/db';

// 관리자 인증 확인 헬퍼
function checkAdminAuth(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: true, message: '인증이 필요합니다.', status: 401 };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload || payload.role !== 'admin') {
    return { error: true, message: '관리자만 접근 가능합니다.', status: 403 };
  }

  return { error: false };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = checkAdminAuth(request.headers.get('Authorization'));
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.message },
        { status: authCheck.status }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { code, name_ko, name_en, display_order } = body;

    // 항공사 존재 확인
    const existing = await query(
      'SELECT id FROM airlines WHERE id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: '존재하지 않는 항공사입니다.' },
        { status: 404 }
      );
    }

    // 코드 중복 확인 (자신 제외)
    if (code) {
      const codeCheck = await query(
        'SELECT id FROM airlines WHERE code = $1 AND id != $2',
        [code, id]
      );
      if (codeCheck.rows.length > 0) {
        return NextResponse.json(
          { error: '이미 존재하는 코드입니다.' },
          { status: 409 }
        );
      }
    }

    // 업데이트 필드 동적 구성
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (code !== undefined) {
      updates.push(`code = $${paramIndex}`);
      values.push(code);
      paramIndex++;
    }
    if (name_ko !== undefined) {
      updates.push(`name_ko = $${paramIndex}`);
      values.push(name_ko);
      paramIndex++;
    }
    if (name_en !== undefined) {
      updates.push(`name_en = $${paramIndex}`);
      values.push(name_en);
      paramIndex++;
    }
    if (display_order !== undefined) {
      updates.push(`display_order = $${paramIndex}`);
      values.push(display_order);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: '수정할 필드가 없습니다.' },
        { status: 400 }
      );
    }

    values.push(id);

    let sql = `UPDATE airlines SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, code, name_ko, name_en`;

    // display_order 컬럼이 있으면 포함, 없으면 0으로 대체
    try {
      // 먼저 컬럼 존재 여부 확인하기 위해 쿼리 시도
      await query('SELECT display_order FROM airlines LIMIT 1');
      sql += ', display_order';
    } catch (err: any) {
      if (err.code === '42703') { // column does not exist
        sql += ', 0 as display_order';
      } else {
        throw err;
      }
    }

    const result = await query(sql, values);

    return NextResponse.json(
      { airline: result.rows[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error('항공사 수정 오류:', error);
    return NextResponse.json(
      { error: '항공사 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = checkAdminAuth(request.headers.get('Authorization'));
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.message },
        { status: authCheck.status }
      );
    }

    const { id } = params;

    // 항공사 존재 확인
    const existing = await query(
      'SELECT id FROM airlines WHERE id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: '존재하지 않는 항공사입니다.' },
        { status: 404 }
      );
    }

    // 사용 중인 사용자 확인
    const userCheck = await query(
      'SELECT COUNT(*) as count FROM users WHERE airline_id = $1',
      [id]
    );

    if (userCheck.rows[0].count > 0) {
      return NextResponse.json(
        { error: '이 항공사를 사용하는 사용자가 있어서 삭제할 수 없습니다.' },
        { status: 409 }
      );
    }

    // 삭제
    await query('DELETE FROM airlines WHERE id = $1', [id]);

    return NextResponse.json(
      { message: '항공사가 삭제되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('항공사 삭제 오류:', error);
    return NextResponse.json(
      { error: '항공사 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
